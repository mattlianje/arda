package arda

import org.mindrot.jbcrypt.BCrypt

case class User(id: Int, username: String, passwordHash: String, isAdmin: Boolean) {
  def validatePassword(rawPassword: String): Boolean = {
    BCrypt.checkpw(rawPassword, passwordHash)
  }
}

object User {
  def hashPassword(rawPassword: String): String = {
    BCrypt.hashpw(rawPassword, BCrypt.gensalt())
  }
}

case class SafeUser(id: Int, username: String, isAdmin: Boolean)
case class Album(id: Int, name: String, ownerId: Int)
case class Photo(id: Int, fileName: String)
case class PhotoAlbum(photoId: Int, albumId: Int)
