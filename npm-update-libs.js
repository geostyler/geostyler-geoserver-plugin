const path = require('path');
const fs = require('fs').promises;
const cp = require('child_process');
const utils = require('util');

const exec = utils.promisify(cp.exec);

(async () => {
  const pckJsonPath = path.join('package.json');
  const tmpDir = path.join('tmp');

  try {
    await exec(`rm -rf ${tmpDir}`);
    await exec(`mkdir -p ${tmpDir}`);
  } catch (error) {
    console.log(error);
    return;
  }

  try {
    const pck = await fs.readFile(pckJsonPath, {
      encoding: 'utf8'
    });

    const pckJson = JSON.parse(pck);

    for (let packageName in pckJson.dependencies) {
      const version = pckJson.dependencies[packageName].replace(/~|\^/g, '');
      const packageInstallation = `${packageName}@${version}`;
      const packCmd = `npm pack ${packageInstallation} --pack-destination ${tmpDir}`;
      const tarCmd = `tar -xzvf ${path.join(tmpDir, packageInstallation.replace('@', '-'))}.tgz --transform='s/package/${packageName}/g' -C ${tmpDir}`;

      console.log('Packing library ' + packageInstallation);

      await exec(packCmd);
      await exec(tarCmd);
    }
  } catch (error) {
    console.log(error);
    return;
  }

  try {
    const targetDir = path.join('src', 'main', 'resources', 'org', 'geoserver', 'wms', 'web', 'data', 'lib');
    const packagesToUpdate = [
      {
        from: path.join(tmpDir, 'antd', 'dist', 'antd.min.css'),
        to: targetDir
      },
      {
        from: path.join(tmpDir, 'geostyler', 'browser', 'geostyler.css'),
        to: targetDir
      },
      {
        from: path.join(tmpDir, 'geostyler', 'browser', 'geostyler.js'),
        to: targetDir
      },
      {
        from: path.join(tmpDir, 'geostyler-geojson-parser', 'browser', 'geoJsonDataParser.js'),
        to: targetDir
      },
      {
        from: path.join(tmpDir, 'geostyler-sld-parser', 'browser', 'sldStyleParser.js'),
        to: targetDir
      },
      {
        from: path.join(tmpDir, 'geostyler-wfs-parser', 'browser', 'wfsDataParser.js'),
        to: targetDir
      },
      {
        from: path.join(tmpDir, 'react', 'umd', 'react.production.min.js'),
        to: targetDir
      },
      {
        from: path.join(tmpDir, 'react-dom', 'umd', 'react-dom.production.min.js'),
        to: targetDir
      }
    ];

    await exec(`rm -rf ${targetDir}`);
    await exec(`mkdir -p ${targetDir}`);

    for (let package of packagesToUpdate) {
      console.log(`Copying from ${package.from} to ${package.to}`);
      const copyCmd = `cp -r ${package.from} ${package.to}`;
      await exec(copyCmd);
    }
  } catch (error) {
    console.error(error);
    return;
  }
})();
