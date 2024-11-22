package arda

class SQLiteUserRepository(db: Database) extends UserRepository {
  override def addUser(user: User): Either[Throwable, Int] = db.execute { conn =>
    val stmt = conn.prepareStatement(
      "INSERT INTO user (username, password, is_admin) VALUES (?, ?, ?)",
      java.sql.Statement.RETURN_GENERATED_KEYS
    )
    stmt.setString(1, user.username)
    stmt.setString(2, user.passwordHash)
    stmt.setBoolean(3, user.isAdmin)
    stmt.executeUpdate()
    val rs = stmt.getGeneratedKeys
    if (rs.next()) rs.getInt(1) else 0
  }

  override def deleteUserById(id: Int): Either[Throwable, Int] = db.execute { conn =>
    val stmt = conn.prepareStatement("DELETE FROM user WHERE id = ?")
    stmt.setInt(1, id)
    val rowsAffected = stmt.executeUpdate()
    if (rowsAffected > 0) id else 0
  }

  override def getAllUsers: Either[Throwable, Option[List[User]]] = db.execute { conn =>
    val stmt = conn.prepareStatement("SELECT * FROM user")
    val rs   = stmt.executeQuery()

    val userList = Iterator
      .continually(rs)
      .takeWhile(_.next())
      .map { rs =>
        User(
          rs.getInt("id"),
          rs.getString("username"),
          rs.getString("password"),
          rs.getBoolean("is_admin")
        )
      }
      .toList
    if (userList.nonEmpty) Some(userList) else None
  }

  override def getUserById(id: Int): Either[Throwable, Option[User]] = db.execute { conn =>
    val stmt = conn.prepareStatement("SELECT * FROM user WHERE id = ?")
    stmt.setInt(1, id)
    val rs = stmt.executeQuery()
    if (rs.next()) {
      Some(
        User(
          rs.getInt("id"),
          rs.getString("username"),
          rs.getString("password"),
          rs.getBoolean("is_admin")
        )
      )
    } else None
  }

  override def getUserByUserName(userName: String): Either[Throwable, Option[User]] = db.execute { conn =>
    val stmt = conn.prepareStatement("SELECT * FROM user WHERE username = ?")
    stmt.setString(1, userName)
    val rs = stmt.executeQuery()
    if (rs.next()) {
      Some(
        User(
          rs.getInt("id"),
          rs.getString("username"),
          rs.getString("password"),
          rs.getBoolean("is_admin")
        )
      )
    } else None
  }

  override def updateUserPassword(userName: String, newPassword: String): Either[Throwable, String] = {
    db.execute { conn =>
      getUserByUserName(userName) match {
        case Right(Some(user)) =>
          val stmt = conn.prepareStatement("UPDATE user SET password = ? WHERE username = ?")
          stmt.setString(1, newPassword)
          stmt.setString(2, user.username)
          stmt.executeUpdate()
          userName

        case Right(None) =>
          throw new Exception(s"User with ID $userName not found.")

        case Left(ex) =>
          throw new Exception(s"Error retrieving user with ID $userName", ex)
      }
    }
  }
}

class SQLitePhotoRepository(db: Database) extends PhotoRepository {
  override def addPhoto(photo: Photo): Either[Throwable, Int] = db.execute { conn =>
    val stmt = conn.prepareStatement(
      "INSERT INTO photo (file_name) VALUES (?)",
      java.sql.Statement.RETURN_GENERATED_KEYS
    )
    stmt.setString(1, photo.fileName)
    stmt.executeUpdate()
    val rs = stmt.getGeneratedKeys
    if (rs.next()) rs.getInt(1) else 0
  }

  override def addPhotos(photos: List[Photo]): Either[Throwable, List[Int]] = db.execute { conn =>
    val stmt = conn.prepareStatement(
      "INSERT INTO photo (file_name) VALUES (?)",
      java.sql.Statement.RETURN_GENERATED_KEYS
    )
    photos.foreach { photo =>
      stmt.setString(1, photo.fileName)
      stmt.addBatch()
    }
    stmt.executeBatch()
    val rs = stmt.getGeneratedKeys
    val generatedKeys = Iterator
      .continually(rs)
      .takeWhile(_.next())
      .map(_.getInt(1))
      .toList
    generatedKeys
  }

  override def deletePhoto(photoId: Int): Either[Throwable, Int] = db.execute { conn =>
    val stmt = conn.prepareStatement("DELETE FROM photo WHERE id = ?")
    stmt.setInt(1, photoId)
    stmt.executeUpdate()
    photoId
  }

  override def deletePhotos(photoIds: List[Int]): Either[Throwable, List[Int]] = db.execute { conn =>
    val stmt = conn.prepareStatement("DELETE FROM photo WHERE id = ?")
    photoIds.foreach { id =>
      stmt.setInt(1, id)
      stmt.addBatch()
    }
    stmt.executeBatch()
    photoIds
  }

  override def getPhotoById(id: Int): Either[Throwable, Option[Photo]] = db.execute { conn =>
    val stmt = conn.prepareStatement("SELECT * FROM photo WHERE id = ?")
    stmt.setInt(1, id)
    val rs = stmt.executeQuery()
    if (rs.next()) {
      Some(Photo(rs.getInt("id"), rs.getString("file_name")))
    } else None
  }

  override def getAllPhotos(): Either[Throwable, Option[List[Photo]]] = db.execute { conn =>
    val stmt = conn.prepareStatement("SELECT * FROM photo")
    val rs   = stmt.executeQuery()

    var photos = List.empty[Photo]
    while (rs.next()) {
      photos = photos :+ Photo(rs.getInt("id"), rs.getString("file_name"))
    }
    if (photos.nonEmpty) Some(photos) else None
  }

  override def linkPhotoToAlbums(
      photoId: Int,
      albumIds: Seq[Int]
  ): Either[Throwable, Unit] = db.execute { conn =>
    val stmt = conn.prepareStatement("INSERT INTO photo_album (photo_id, album_id) VALUES (?, ?)")
    albumIds.foreach { albumId =>
      stmt.setInt(1, photoId)
      stmt.setInt(2, albumId)
      stmt.addBatch()
    }
    stmt.executeBatch()
  }
}

class SQLiteAlbumRepository(db: Database) extends AlbumRepository {
  override def addAlbum(album: Album): Either[Throwable, Int] = db.execute { conn =>
    val stmt = conn.prepareStatement(
      "INSERT INTO album (name, owner_id) VALUES (?, ?)",
      java.sql.Statement.RETURN_GENERATED_KEYS
    )
    stmt.setString(1, album.name)
    stmt.setInt(2, album.ownerId)
    stmt.executeUpdate()
    val rs = stmt.getGeneratedKeys
    rs.getInt(1)
  }

  override def deleteAlbumById(id: Int): Either[Throwable, Int] = db.execute { conn =>
    val stmt = conn.prepareStatement("DELETE FROM album WHERE id = ?")
    stmt.setInt(1, id)
    val rowsAffected = stmt.executeUpdate()
    if (rowsAffected > 0) id else 0
  }

  override def getAlbumById(id: Int): Either[Throwable, Option[Album]] = db.execute { conn =>
    val stmt = conn.prepareStatement("SELECT * FROM album WHERE id = ?")
    stmt.setInt(1, id)
    val rs = stmt.executeQuery()
    if (rs.next()) {
      Some(Album(rs.getInt("id"), rs.getString("name"), rs.getInt("owner_id")))
    } else {
      None
    }
  }

  override def getPhotosInAlbum(albumName: String): Either[Throwable, Option[List[Photo]]] = db.execute {
    conn =>
      val stmt = conn.prepareStatement("""
      SELECT p.id, p.file_name
      FROM photo p
      INNER JOIN photo_album pa ON p.id = pa.photo_id
      INNER JOIN album a ON pa.album_id = a.id
      WHERE a.name = ?
    """)
      stmt.setString(1, albumName)
      val rs = stmt.executeQuery()

      var photos = List.empty[Photo]
      while (rs.next()) {
        photos = photos :+ Photo(rs.getInt("id"), rs.getString("file_name"))
      }
      if (photos.nonEmpty) Some(photos) else None
  }

  override def getAllAlbums(): Either[Throwable, Option[List[Album]]] = db.execute { conn =>
    val stmt = conn.prepareStatement("SELECT * FROM album")
    val rs   = stmt.executeQuery()

    var albums = List.empty[Album]
    while (rs.next()) {
      albums = albums :+ Album(rs.getInt("id"), rs.getString("name"), rs.getInt("owner_id"))
    }

    if (albums.nonEmpty) Some(albums) else None
  }

  override def linkPhotosToAlbum(albumId: Int, photoIds: List[Int]): Either[Throwable, Int] = db.execute {
    conn =>
      try {
        conn.setAutoCommit(false)

        val stmt = conn.prepareStatement(
          """INSERT INTO photo_album (album_id, photo_id) 
         SELECT ?, ? 
         WHERE NOT EXISTS (
           SELECT 1 FROM photo_album 
           WHERE album_id = ? AND photo_id = ?
         )"""
        )
        var successCount = 0
        photoIds.foreach { photoId =>
          stmt.setInt(1, albumId)
          stmt.setInt(2, photoId)
          stmt.setInt(3, albumId)
          stmt.setInt(4, photoId)
          successCount += stmt.executeUpdate()
        }

        conn.commit()
        successCount
      } catch {
        case e: Throwable =>
          conn.rollback()
          throw e
      } finally {
        conn.setAutoCommit(true)
      }
  }
}
