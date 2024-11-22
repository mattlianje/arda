package arda

import java.nio.file.{Files, Paths}
import java.sql.{Connection, DriverManager, PreparedStatement, ResultSet, SQLException}
import scala.util.{Try, Using}

trait Database {
  protected def withConnection[T](block: Connection => T): Either[Throwable, T]
  def execute[T](block: Connection => T): Either[Throwable, T] = withConnection(block)
}

class SQLiteDatabase(val dbUrl: String) extends Database {
  protected def withConnection[T](block: Connection => T): Either[Throwable, T] = {
    try {
      val path = Paths.get(dbUrl.replace("jdbc:sqlite:", ""))
      if (path.getParent != null) Files.createDirectories(path.getParent)

      val connection = DriverManager.getConnection(dbUrl)
      try {
        setupTables(connection)
        Right(block(connection))
      } finally connection.close()
    } catch {
      case e: SQLException => Left(e)
    }
  }

  private def setupTables(connection: Connection): Unit = {
    val createStatements = List(
      """
        |CREATE TABLE IF NOT EXISTS user (
        |  id INTEGER PRIMARY KEY AUTOINCREMENT,
        |  username TEXT UNIQUE,
        |  password TEXT,
        |  is_admin BOOLEAN
        |);
      """.stripMargin,
      """
        |CREATE TABLE IF NOT EXISTS album (
        |  id INTEGER PRIMARY KEY AUTOINCREMENT,
        |  name TEXT UNIQUE,
        |  owner_id INTEGER,
        |  FOREIGN KEY(owner_id) REFERENCES user(id)
        |);
      """.stripMargin,
      """
        |CREATE TABLE IF NOT EXISTS photo (
        |  id INTEGER PRIMARY KEY AUTOINCREMENT,
        |  file_name TEXT
        |);
      """.stripMargin,
      """
        |CREATE TABLE IF NOT EXISTS photo_album (
        |  photo_id INTEGER,
        |  album_id INTEGER,
        |  FOREIGN KEY(photo_id) REFERENCES photo(id),
        |  FOREIGN KEY(album_id) REFERENCES album(id),
        |  PRIMARY KEY (photo_id, album_id)
        |);
      """.stripMargin
    )

    val stmt = connection.createStatement()
    createStatements.foreach(stmt.execute)
    stmt.close()
  }
}
