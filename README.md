# GeoStyler GeoServer extension

This extension integrates the GeoStyler UI into the GeoServer styles tab.

![Preview](./preview.png)

## Installation 🥳

To install the extension to your GeoServer just proceed as follows:

1. Download the matching jar from [here](https://github.com/geostyler/geostyler-geoserver-plugin/packages).
2. Copy the jar into the `WEB-INF/lib` directory of your GeoServer installation.
3. Restart GeoServer.

## Development 🏗️

Basically the plugin just includes the JavaScript resources of the GeoStyler into
a Wicket page which in turn will be rendered by the GeoServer. The lib files aren't
part of the repository and need to be packed into the plugin during build. To build
the plugin (including the JS sources), just execute:

```
mvn clean package
```

This will create a `gs-geostyler-<VERSION>.jar` file inside the `target` directory
which can be copied to the GeoServer's lib directory. For testing purposes this
repository contains a dockerized GeoServer:

1. Copy the freshly created jar into the lib directory:

```
cp ./target/gs-geostyler-<VERSION>.jar ./docker/geoserver/additional_libs
```

2. Run GeoServer:

```
docker-compose up --build --force-recreate --remove-orphans
```

## Release 📰

- Checkout the latest `main`.
- Run the release script, e.g.

```bash
#./scripts/release.sh RELEASE_VERSION DEVELOPMENT_VERSION
./scripts/release.sh "3.0.0" "3.0.1-SNAPSHOT"
```

- Go to `Releases` page in GitHub and publish the newly created release.
