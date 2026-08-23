// swift-tools-version: 5.9
import PackageDescription

// DO NOT MODIFY THIS FILE - managed by Capacitor CLI commands
let package = Package(
    name: "CapApp-SPM",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapApp-SPM",
            targets: ["CapApp-SPM"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.1.0"),
        .package(url: "https://github.com/ionic-team/capacitor-camera.git", exact: "7.0.0"),
        .package(url: "https://github.com/ionic-team/capacitor-geolocation.git", exact: "7.0.0"),
        .package(url: "https://github.com/ionic-team/capacitor-push-notifications.git", exact: "7.0.0")
    ],
    targets: [
        .target(
            name: "CapApp-SPM",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "CapacitorCamera", package: "capacitor-camera"),
                .product(name: "CapacitorGeolocation", package: "capacitor-geolocation"),
                .product(name: "CapacitorPushNotifications", package: "capacitor-push-notifications")
            ]
        )
    ]
)
