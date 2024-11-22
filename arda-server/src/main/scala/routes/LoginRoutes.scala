package routes

import arda.{User, UserRepository}
import cats.effect.IO
import dev.profunktor.auth.jwt.{JwtAuth, JwtToken}
import io.circe.Json
import io.circe.parser.decode
import org.http4s.{EntityDecoder, HttpRoutes}
import org.http4s.circe.jsonOf
import org.http4s.dsl.io.*
import pdi.jwt.{JwtAlgorithm, JwtCirce, JwtClaim}
import io.circe.*
import org.http4s.circe.*
import io.circe.generic.auto.*

import java.time.Instant

case class LoginRoutes(userRepo: UserRepository) {
  case class LoginRequest(username: String, password: String)
  case class TokenPayload(username: String, isAdmin: Boolean)

  implicit val loginReqDecoder: EntityDecoder[IO, LoginRequest] = jsonOf[IO, LoginRequest]

  private val key      = "secretKey"
  private val algo     = JwtAlgorithm.HS256
  val jwtAuth: JwtAuth = JwtAuth.hmac(key, algo)

  private def createToken(user: User): String = {
    val claim = JwtClaim(
      content = s"""{"username":"${user.username}","isAdmin":${user.isAdmin}}""",
      expiration = Some(Instant.now.plusSeconds(157784760).getEpochSecond),
      issuedAt = Some(Instant.now.getEpochSecond)
    )
    JwtCirce.encode(claim, key, algo)
  }

  def authenticate: JwtToken => JwtClaim => IO[Option[User]] =
    (_: JwtToken) =>
      (claim: JwtClaim) =>
        decode[TokenPayload](claim.content) match {
          case Right(payload) =>
            userRepo
              .getUserByUserName(payload.username)
              .fold(
                _ => IO.pure(None),
                user => IO.pure(user)
              )
          case Left(_) => IO.pure(None)
        }

  val routes: HttpRoutes[IO] = HttpRoutes.of[IO] { case req @ POST -> Root / "auth" / "login" =>
    req.decodeJson[LoginRequest].flatMap { login =>
      userRepo
        .getUserByUserName(login.username)
        .fold(
          _ => Forbidden("Authentication failed"),
          {
            case Some(user) if user.validatePassword(login.password) =>
              val token = createToken(user)
              Ok(
                Json.obj(
                  "token" -> Json.fromString(token),
                  "message" -> Json.fromString(
                    s"Welcome ${user.username} logged in as ${if (user.isAdmin) "admin" else "user"}"
                  )
                )
              )
            case _ =>
              Forbidden("Invalid credentials")
          }
        )
    }
  }
}
