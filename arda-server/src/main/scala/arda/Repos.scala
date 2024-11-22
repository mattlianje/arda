package arda

trait UserRepository {
  def addUser(user: User): Either[Throwable, Int]
  def deleteUserById(id: Int): Either[Throwable, Int]
  def getAllUsers: Either[Throwable, Option[List[User]]]
  def getUserById(id: Int): Either[Throwable, Option[User]]
  def getUserByUserName(userName: String): Either[Throwable, Option[User]]
  def updateUserPassword(userName: String, newPassword: String): Either[Throwable, String]
}

trait AlbumRepository {
  def addAlbum(album: Album): Either[Throwable, Int]
  def deleteAlbumById(album: Int): Either[Throwable, Int]
  def getAlbumById(id: Int): Either[Throwable, Option[Album]]
  def getPhotosInAlbum(name: String): Either[Throwable, Option[List[Photo]]]
  def getAllAlbums(): Either[Throwable, Option[List[Album]]]
  def linkPhotosToAlbum(albumId: Int, photoIds: List[Int]): Either[Throwable, Int]
}

trait PhotoRepository {
  def addPhoto(photo: Photo): Either[Throwable, Int]
  def addPhotos(photo: List[Photo]): Either[Throwable, List[Int]]
  def deletePhoto(photoId: Int): Either[Throwable, Int]
  def deletePhotos(photoId: List[Int]): Either[Throwable, List[Int]]
  def getPhotoById(id: Int): Either[Throwable, Option[Photo]]
  def getAllPhotos(): Either[Throwable, Option[List[Photo]]]
  def linkPhotoToAlbums(photoId: Int, albumIds: Seq[Int]): Either[Throwable, Unit]
}
