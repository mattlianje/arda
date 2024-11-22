package arda

import java.nio.file.{Files, Path, StandardCopyOption}
import scala.util.{Failure, Success, Try}

trait FileService {
  def initialize(): Either[String, Unit]
  def put(fileName: String, content: Array[Byte]): Either[String, Unit]
  def delete(fileName: String): Either[String, Unit]
  def get(fileName: String): Either[String, Array[Byte]]
  def exists(fileName: String): Boolean
  def putFromPath(fileName: String, sourcePath: Path): Either[String, Unit]
  def resolvePath(fileName: String): Path
}

class LocalFileService private (rootDir: Path) extends FileService {
  private def sanitizeFileName(fileName: String): String = {
    val normalized = Path.of(fileName).normalize().toString
    if (normalized.contains("..")) {
      throw new IllegalArgumentException("Just in case: path traversal not allowed")
    }
    normalized.replace("\\", "/")
  }

  private def resolveAndValidate(fileName: String): Either[String, Path] = {
    Try {
      val safe     = sanitizeFileName(fileName)
      val resolved = rootDir.resolve(safe).normalize()
      if (!resolved.startsWith(rootDir)) {
        throw new IllegalArgumentException("Invalid file path: must be within root directory")
      }
      resolved
    }.toEither.left.map(_.getMessage)
  }

  override def initialize(): Either[String, Unit] = {
    Try(Files.createDirectories(rootDir)).toEither
      .map(_ => ())
      .left
      .map(ex => s"Failed to initialize directory: ${ex.getMessage}")
  }

  override def put(fileName: String, content: Array[Byte]): Either[String, Unit] = {
    for {
      path <- resolveAndValidate(fileName)
      _ <- Try {
        Files.createDirectories(path.getParent)
        Files.write(path, content)
      }.toEither.left.map(ex => s"Failed to write file: ${ex.getMessage}")
    } yield ()
  }

  override def putFromPath(fileName: String, sourcePath: Path): Either[String, Unit] = {
    for {
      destPath <- resolveAndValidate(fileName)
      _ <- Try {
        Files.createDirectories(destPath.getParent)
        Files.copy(sourcePath, destPath, StandardCopyOption.REPLACE_EXISTING)
      }.toEither.left.map(ex => s"Failed to copy file: ${ex.getMessage}")
    } yield ()
  }

  override def delete(fileName: String): Either[String, Unit] = {
    for {
      path <- resolveAndValidate(fileName)
      _ <- Try(Files.deleteIfExists(path)).toEither.left.map(ex => s"Failed to delete file: ${ex.getMessage}")
    } yield ()
  }

  override def get(fileName: String): Either[String, Array[Byte]] = {
    for {
      path  <- resolveAndValidate(fileName)
      bytes <- Try(Files.readAllBytes(path)).toEither.left.map(ex => s"Failed to read file: ${ex.getMessage}")
    } yield bytes
  }

  override def exists(fileName: String): Boolean = {
    resolveAndValidate(fileName).map(Files.exists(_)).getOrElse(false)
  }

  override def resolvePath(fileName: String): Path = {
    resolveAndValidate(fileName)
      .getOrElse(rootDir.resolve(sanitizeFileName(fileName)))
  }
}

object LocalFileService {
  def apply(rootDir: Path): Either[String, LocalFileService] = {
    Try {
      val normalized = rootDir.toAbsolutePath.normalize()
      val service    = new LocalFileService(normalized)
      service.initialize().map(_ => service)
    }.toEither.left.map(_.getMessage).flatten
  }
}
