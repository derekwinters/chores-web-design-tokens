// Publishes the generated Kotlin token constants (dist/android/DesignTokens.kt)
// as a plain JVM library: com.derekwinters.chores:design-tokens.
// Pure constants — no Android or Compose dependency — so a JVM artifact is
// consumable from the Android app without an AGP build here.
//
// Build order: `npm run build` must run first (generates ../dist/android).
// Version comes from -Pversion=<x.y.z> (CI passes the release-please version);
// falls back to package.json's version for local builds.
import groovy.json.JsonSlurper

plugins {
    kotlin("jvm") version "1.9.24"
    `maven-publish`
}

group = "com.derekwinters.chores"
version = (findProperty("version")?.takeIf { it != "unspecified" }
    ?: (JsonSlurper().parse(rootDir.resolve("../package.json")) as Map<*, *>)["version"] as String)

kotlin {
    jvmToolchain(17)
    sourceSets["main"].kotlin.srcDir(rootDir.resolve("../dist/android"))
}

java {
    withSourcesJar()
}

publishing {
    publications {
        create<MavenPublication>("maven") {
            from(components["java"])
            artifactId = "design-tokens"
            pom {
                name.set("chores-web design tokens")
                description.set("Generated design-token constants for chores-web Android")
                url.set("https://github.com/derekwinters/chores-web-design-tokens")
            }
        }
    }
    repositories {
        maven {
            name = "GitHubPackages"
            url = uri("https://maven.pkg.github.com/derekwinters/chores-web-design-tokens")
            credentials {
                username = System.getenv("GITHUB_ACTOR")
                password = System.getenv("GITHUB_TOKEN")
            }
        }
    }
}
