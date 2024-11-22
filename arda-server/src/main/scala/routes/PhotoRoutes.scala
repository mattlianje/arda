package routes

import arda.{FileService, Photo, PhotoRepository, User}
import cats.effect.IO
import fs2.Stream
import org.http4s.{AuthedRoutes, HttpRoutes, MediaType}
import org.http4s.dsl.io.*
import org.http4s.headers.`Content-Type`
import org.http4s.multipart.{Multipart, Part}
import org.http4s.server.AuthMiddleware

import java.nio.file.{Files, Path}
import java.time.Instant

case class PhotoRoutes(photoRepo: PhotoRepository, fileService: FileService) {
  def routes(middleware: AuthMiddleware[IO, User]): HttpRoutes[IO] = {
    val authedRoutes = AuthedRoutes.of[User, IO] {
      case req @ POST -> Root / "photos" / "upload" as _ =>
        req.req.decode[Multipart[IO]] { multipart =>
          val timestamp = Instant.now().toEpochMilli.toString
          multipart.parts.headOption match {
            case Some(part) =>
              saveTempUploadedFile(part, timestamp).flatMap { case (tempPath, fileName) =>
                fileService.putFromPath(fileName, tempPath) match {
                  case Right(_) =>
                    val photo = Photo(0, fileName)
                    photoRepo.addPhoto(photo) match {
                      case Right(photoId) => Ok(s"Photo uploaded successfully with ID: $photoId")
                      case Left(error)    => InternalServerError(s"Failed to add photo: $error")
                    }
                  case Left(error) => InternalServerError(s"Upload error: $error")
                }
              }
            case None => BadRequest("No file part found")
          }
        }

      case GET -> Root / "photos" as _ =>
        photoRepo.getAllPhotos() match {
          case Right(photos) =>
            val photoIds = photos.map(_.map(_.id)).mkString(",")
            Ok(photoIds)
          case Left(error) => InternalServerError(s"Failed to retrieve photos: $error")
        }

      case GET -> Root / "photos" / IntVar(photoId) as _ =>
        photoRepo.getPhotoById(photoId) match {
          case Right(Some(photo)) =>
            fileService.get(photo.fileName) match {
              case Right(bytes) =>
                Ok(Stream.emits(bytes).covary[IO])
                  .map(_.withContentType(`Content-Type`(MediaType.image.jpeg)))
              case Left(error) => NotFound(s"Error retrieving photo: $error")
            }
          case Right(None) => NotFound(s"Photo not found for ID: $photoId")
          case Left(error) => InternalServerError(s"Failed to retrieve photo: $error")
        }

      case POST -> Root / "photos" / "delete" / IntVar(photoId) as user if user.isAdmin =>
        val result = for {
          photoOpt <- photoRepo.getPhotoById(photoId)
          photo    <- photoOpt.toRight("Photo not found")
          _        <- fileService.delete(photo.fileName)
          _        <- photoRepo.deletePhoto(photoId)
        } yield ()

        result match {
          case Right(_)    => Ok(s"Photo with ID $photoId deleted successfully.")
          case Left(error) => InternalServerError(s"Failed to delete photo: $error")
        }

      case POST -> Root / "photos" / "delete" / IntVar(_) as _ =>
        Forbidden("Admin access required for deletion")
    }

    middleware(authedRoutes)
  }

  private def saveTempUploadedFile(part: Part[IO], timestamp: String): IO[(Path, String)] = {
    val fileName = s"${timestamp}_${part.filename.getOrElse("unknown")}"
    val tempPath = Files.createTempFile("upload-", fileName)
    part.body
      .through(fs2.io.file.Files[IO].writeAll(fs2.io.file.Path.fromNioPath(tempPath)))
      .compile
      .drain
      .map(_ => (tempPath, fileName))
  }
}
