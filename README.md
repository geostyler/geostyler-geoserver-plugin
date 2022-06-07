# GeoStyler GeoServer extension

This extension integrates the GeoStyler UI into the GeoServer styles tab.

![Preview](./preview.png)

## Installation 🥳

To install the extension to your GeoServer just proceed as follows:

1. Download the matching jar from [here](TODO).
2. Copy the jar into the `WEB-INF/lib` directory of your GeoServer installation.
3. Restart GeoServer.

## Development 🏗️

### Update GeoStyler version

- Update versions in `package.json` as desired
- Run `npm i`
- Run `npm run update`

### Build maven artifact

- `mvn clean package`

### Docker

- `cp ./target/gs-geostyler-1.0.0.jar ./docker/geoserver/additional_libs`
- `docker-compose up --build --force-recreate --remove-orphans`
