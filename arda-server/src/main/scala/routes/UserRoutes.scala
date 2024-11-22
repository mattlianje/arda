package routes

import arda.{User, UserRepository}
import cats.effect.IO
import io.circe.Json
import org.http4s.{AuthedRoutes, HttpRoutes}
import org.http4s.dsl.io.*
import org.http4s.server.AuthMiddleware
import io.circe.*
import org.http4s.circe.*
import io.circe.generic.auto.*
import io.circe.syntax.*

case class UserRoutes(userRepo: UserRepository) {
  def routes(middleware: AuthMiddleware[IO, User]): HttpRoutes[IO] = {
    val authedRoutes = AuthedRoutes.of[User, IO] {
      case GET -> Root / "users" / "users" as user if user.isAdmin =>
        userRepo.getAllUsers.fold(
          err => InternalServerError(err.getMessage),
          {
            case Some(users) => Ok(users.asJson)
            case None        => Ok("[]")
          }
        )

      case GET -> Root / "users" / "user" / username as user =>
        userRepo
          .getUserByUserName(username)
          .fold(
            err => InternalServerError(err.getMessage),
            {
              case Some(user) => Ok(user.asJson)
              case None       => NotFound(s"User $username not found")
            }
          )

      case req @ POST -> Root / "users" / "create" as user if user.isAdmin =>
        req.req.decodeJson[User].flatMap { newUser =>
          val processedUser = newUser.copy(
            passwordHash = User.hashPassword(newUser.passwordHash)
          )
          userRepo
            .addUser(processedUser)
            .fold(
              err => InternalServerError(s"Failed to create user: ${err.getMessage}"),
              userId => Ok(processedUser.copy(id = userId).asJson)
            )
        }

      case req @ POST -> Root / "users" / "password" / username as user
          if user.isAdmin || user.username == username =>
        req.req.decodeJson[Json].flatMap { json =>
          json.hcursor
            .get[String]("password")
            .fold(
              err => BadRequest("Password field required"),
              newPassword =>
                userRepo
                  .updateUserPassword(username, User.hashPassword(newPassword))
                  .fold(
                    err => InternalServerError(s"Failed to update password: ${err.getMessage}"),
                    username => Ok(s"Password updated for user: $username")
                  )
            )
        }

      case DELETE -> Root / "users" / "user" / IntVar(userId) as user if user.isAdmin =>
        userRepo
          .deleteUserById(userId)
          .fold(
            err => InternalServerError(s"Failed to delete user: ${err.getMessage}"),
            _ => Ok(s"User $userId deleted")
          )

      case GET -> Root / "users" / "profile" as user =>
        Ok(user.asJson)

      case _ -> Root / "users" / "users" as _ =>
        Forbidden("Admin access required")
      case _ -> Root / "users" / "user" / _ as _ =>
        Forbidden("Admin access required")
      case _ -> Root / "users" / "create" as _ =>
        Forbidden("Admin access required")
      case _ -> Root / "users" / "delete" / _ as _ =>
        Forbidden("Admin access required")
    }

    middleware(authedRoutes)
  }
}
