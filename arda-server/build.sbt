ThisBuild / version := "0.1.0-SNAPSHOT"
Compile/mainClass := Some("arda.Main")
scalacOptions += "-Ykind-projector"

assembly / assemblyMergeStrategy := {
  case "module-info.class" => MergeStrategy.discard
  case "META-INF/versions/9/module-info.class" => MergeStrategy.discard
  case x =>
    val oldStrategy = (assembly / assemblyMergeStrategy).value
    oldStrategy(x)
}

val Http4sVersion = "0.23.18"
val JwtHttp4sVersion = "1.2.0"
val JwtScalaVersion = "9.3.0"

lazy val rootProject = (project in file("."))
  .settings(
    name := "arda",
    version := "0.1.0-SNAPSHOT",
    organization := "io.github.mattlianje",
    scalaVersion := "3.4.2",
    excludeDependencies ++= Seq(
      "org.scala-lang" % "scala3-library_sjs1_3"
    ),
    libraryDependencies ++= Seq(
      "com.lihaoyi" %% "os-lib" % "0.10.7",
      "com.auth0" % "java-jwt" % "4.4.0",
      "org.xerial" % "sqlite-jdbc" % "3.46.0.0",

      "org.http4s" %% "http4s-dsl" % Http4sVersion,
      "org.http4s" %% "http4s-ember-server" % Http4sVersion,
      "dev.profunktor" %% "http4s-jwt-auth" % JwtHttp4sVersion,
      "com.github.jwt-scala" %% "jwt-core" % JwtScalaVersion,
      "com.github.jwt-scala" %% "jwt-circe" % JwtScalaVersion,

      "org.http4s" %% "http4s-circe" % Http4sVersion,
      "org.http4s" %% "http4s-ember-client" % Http4sVersion,
      "org.typelevel" %% "log4cats-slf4j" % "2.6.0",
      "io.circe" %% "circe-generic" % "0.14.7",
      "com.typesafe" % "config" % "1.4.3",
      "org.mindrot" % "jbcrypt" % "0.4",
      "ch.qos.logback" % "logback-classic" % "1.5.8",
      "org.scalatest" %% "scalatest" % "3.2.19" % Test,
      "com.softwaremill.sttp.client3" %% "circe" % "3.9.8" % Test,
      "org.scalamock" %% "scalamock" % "6.0.0" % Test
    )
  )
