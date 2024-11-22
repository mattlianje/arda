package arda

import arda.{
  AlbumRepository,
  Database,
  FileService,
  LocalFileService,
  PhotoRepository,
  SQLiteAlbumRepository,
  SQLiteDatabase,
  SQLitePhotoRepository,
  SQLiteUserRepository,
  User,
  UserRepository
}
import cats.effect.{ExitCode, IO, IOApp}
import cats.implicits.*
import com.comcast.ip4s.*
import com.typesafe.config.Config
import dev.profunktor.auth.*
import org.http4s.*
import org.http4s.ember.server.*
import org.http4s.headers.Origin
import org.http4s.server.middleware.CORS
import routes.{AlbumRoutes, LoginRoutes, PhotoRoutes, UserRoutes}
import utils.ConfigLoader

import java.nio.file.{Files, Path, Paths}

object Main extends IOApp {
  private case class Services(
      userRepo: UserRepository,
      photoRepo: PhotoRepository,
      albumRepo: AlbumRepository,
      fileService: FileService
  )

  private def initServices(config: Config): Either[Throwable, Services] = {
    val dbUrl =
      s"jdbc:sqlite:${config.getString("arda.db.dir").replaceFirst("^~", os.home.toString())}/arda.db"
    val photoDir     = Paths.get(config.getString("arda.photos.dir").replaceFirst("^~", os.home.toString()))
    val db: Database = new SQLiteDatabase(dbUrl)

    LocalFileService(photoDir).left
      .map(error => new RuntimeException(s"Failed to initialize FileService: $error"))
      .map(fileService =>
        Services(
          new SQLiteUserRepository(db),
          new SQLitePhotoRepository(db),
          new SQLiteAlbumRepository(db),
          fileService
        )
      )
  }

  override def run(args: List[String]): IO[ExitCode] = {
    val env = args.headOption.getOrElse("dev")
    initServices(ConfigLoader.loadConfig(env)).fold(
      error => IO(println(s"Initialization failed: ${error.getMessage}")) *> IO.pure(ExitCode.Error),
      services => {
        val config         = ConfigLoader.loadConfig(env)
        val serverPort     = config.getInt("arda.server.port")
        val loginRoutes    = LoginRoutes(services.userRepo)
        val authMiddleware = JwtAuthMiddleware[IO, User](loginRoutes.jwtAuth, loginRoutes.authenticate)

        val routes = CORS.policy
          .withAllowOriginHost(
            Set(
              Origin.Host(Uri.Scheme.http, Uri.RegName("localhost"), Some(3000)),
              Origin.Host(Uri.Scheme.https, Uri.RegName("arda.nargothrond.xyz"), None)
            )
          )
          .withAllowCredentials(true)(
            loginRoutes.routes <+>
            UserRoutes(services.userRepo).routes(authMiddleware) <+>
            PhotoRoutes(services.photoRepo, services.fileService).routes(authMiddleware) <+>
            AlbumRoutes(services.albumRepo).routes(authMiddleware)
          )

        EmberServerBuilder
          .default[IO]
          .withHost(ipv4"0.0.0.0")
          .withPort(Port.fromInt(serverPort).get)
          .withHttpApp(routes.orNotFound)
          .build
          .use(_ => IO.never)
          .as(ExitCode.Success)
      }
    )
  }
}
