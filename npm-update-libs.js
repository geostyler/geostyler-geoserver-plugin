const path = require('path');
const fs = require('fs').promises;
const cp = require('child_process');
const utils = require('util');

const exec = utils.promisify(cp.exec);

(async () => {
  try {
    const pck = await fs.readFile('./package.json', {
      encoding: 'utf8'
    });

    const pckJson = JSON.parse(pck);

    for (let packageName in pckJson.dependencies) {
      const version = pckJson.dependencies[packageName].replace(/~|\^/g, '');
      const packageInstallation = `${packageName}@${version}`;
      const targetPath = path.join('.', packageName);
      const packCmd = `npm pack ${packageInstallation}`;
      const tarCmd = `tar -xzvf ${packageInstallation.replace('@', '-')}.tgz --transform='s/package/${packageName}/g'`;
      const rmCmd = `rm ${packageInstallation.replace('@', '-')}.tgz`;

      console.log('Packing library ' + packageInstallation);

      await exec(`rm -rf ${targetPath}`);
      await exec(packCmd);
      await exec(tarCmd);
      await exec(rmCmd);
    }
  } catch (error) {
    console.log(error);
  }

  try {
    const targetDir = 'src/main/java/org/geoserver/wms/web/data/assets';
    const packagesToUpdate = [
      {
        from: 'antd/dist/antd.min.css',
        to: targetDir
      },
      {
        from: 'geostyler/browser/geostyler.css',
        to: targetDir
      },
      {
        from: 'geostyler/browser/geostyler.js',
        to: targetDir
      },
      {
        from: 'geostyler-geojson-parser/browser/geoJsonDataParser.js',
        to: targetDir
      },
      {
        from: 'geostyler-sld-parser/browser/sldStyleParser.js',
        to: targetDir
      },
      {
        from: 'geostyler-wfs-parser/browser/wfsDataParser.js',
        to: targetDir
      },
      {
        from: 'react/umd/react.production.min.js',
        to: targetDir
      },
      {
        from: 'react-dom/umd/react-dom.production.min.js',
        to: targetDir
      }
    ];

    for (let package of packagesToUpdate) {
      console.log(`Copying from ${package.from} to ${package.to}`);
      const copyCmd = `cp -r ${package.from} ${package.to}`;
      await exec(copyCmd);
    }
  } catch (error) {
    console.error(error);
  }
})();
