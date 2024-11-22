package routes

import arda.{Album, AlbumRepository, User}
import cats.effect.IO
import org.http4s.{AuthedRoutes, HttpRoutes, UrlForm}
import org.http4s.dsl.io.*
import org.http4s.server.AuthMiddleware
import io.circe.*
import org.http4s.circe.*
import io.circe.generic.auto.*
import io.circe.syntax.*

case class AlbumRoutes(albumRepo: AlbumRepository) {
  def routes(middleware: AuthMiddleware[IO, User]): HttpRoutes[IO] = {
    val authedRoutes = AuthedRoutes.of[User, IO] {
      case req @ POST -> Root / "albums" / "create" as user =>
        req.req.decode[UrlForm] { form =>
          val name  = form.getFirstOrElse("name", "")
          val album = Album(0, name, ownerId = user.id)
          albumRepo.addAlbum(album) match {
            case Right(albumId) =>
              Ok(s"Album created successfully with ID: $albumId")
            case Left(error) =>
              InternalServerError(s"Failed to create album: ${error.getMessage}")
          }
        }

      case POST -> Root / "albums" / "delete" / IntVar(albumId) as user =>
        albumRepo.getAlbumById(albumId) match {
          case Right(Some(album)) if user.isAdmin || album.ownerId == user.id =>
            albumRepo.deleteAlbumById(albumId) match {
              case Right(_) =>
                Ok(s"Album with ID $albumId deleted successfully.")
              case Left(error) =>
                InternalServerError(s"Failed to delete album with ID $albumId: ${error.getMessage}")
            }
          case Right(Some(_)) =>
            Forbidden("Only album owner or admin can delete albums")
          case Right(None) =>
            NotFound(s"Album not found for ID: $albumId")
          case Left(error) =>
            InternalServerError(s"Failed to retrieve album: ${error.getMessage}")
        }

      case GET -> Root / "albums" / albumName / "photos" as _ =>
        albumRepo.getPhotosInAlbum(albumName) match {
          case Right(Some(photos)) =>
            Ok(photos.map(_.id).mkString(","))
          case Right(None) =>
            NotFound(s"No photos found for album: $albumName")
          case Left(error) =>
            InternalServerError(s"Failed to retrieve photos for album $albumName: ${error.getMessage}")
        }

      case GET -> Root / "albums" as _ =>
        albumRepo.getAllAlbums() match {
          case Right(Some(albums)) =>
            Ok(albums.asJson)
          case Right(None) =>
            Ok(List.empty[Album].asJson)
          case Left(error) =>
            InternalServerError(s"Failed to retrieve albums: ${error.getMessage}")
        }

      case req @ POST -> Root / "albums" / IntVar(albumId) / "photos" / "link" as user =>
        req.req.decode[UrlForm] { form =>
          val photoIdsStr = form.getFirstOrElse("photoIds", "")

          if (photoIdsStr.isEmpty) {
            BadRequest("No photo IDs provided")
          } else {
            val photoIds = photoIdsStr
              .split(",")
              .map(_.trim)
              .filter(_.nonEmpty)
              .map(_.toInt)
              .toList

            albumRepo.getAlbumById(albumId) match {
              case Right(Some(album)) if user.isAdmin || album.ownerId == user.id =>
                albumRepo.linkPhotosToAlbum(albumId, photoIds) match {
                  case Right(count) =>
                    Ok(s"Successfully linked $count photos to album $albumId")
                  case Left(error) =>
                    InternalServerError(s"Failed to link photos: ${error.getMessage}")
                }
              case Right(Some(_)) =>
                Forbidden("Only album owner or admin can link photos")
              case Right(None) =>
                NotFound(s"Album not found for ID: $albumId")
              case Left(error) =>
                InternalServerError(s"Failed to check album: ${error.getMessage}")
            }
          }
        }
    }

    middleware(authedRoutes)
  }
}
