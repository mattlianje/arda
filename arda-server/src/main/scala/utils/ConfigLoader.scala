package utils

import com.typesafe.config.{Config, ConfigFactory}

object ConfigLoader {
  def loadConfig(env: String): Config = {
    val config = env match {
      case "prod" => ConfigFactory.load("conf/application-prod.conf")
      case "dev"  => ConfigFactory.load("conf/application-dev.conf")
      case _      => throw new RuntimeException("Invalid Config")
    }
    config
  }
}
