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

      // Generate correct filename for scoped packages
      // @ant-design/icons@5.5.1 becomes ant-design-icons-5.5.1.tgz
      let tarFileName;
      if (packageName.startsWith('@')) {
        // Remove @ and replace / with -
        tarFileName = `${packageName.substring(1).replace('/', '-')}-${version}.tgz`;
      } else {
        tarFileName = `${packageName}-${version}.tgz`;
      }

      // Escape packageName for transform expression (escape forward slashes only, not @)
      const escapedPackageName = packageName.replace(/\//g, '\\/');
      const tarCmd = `tar -xzvf ${path.join(tmpDir, tarFileName)} --transform='s/package/${escapedPackageName}/g' -C ${tmpDir}`;

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
        from: path.join(tmpDir, 'react', 'umd', 'react.production.min.js'),
        to: targetDir
      },
      {
        from: path.join(tmpDir, 'react-dom', 'umd', 'react-dom.production.min.js'),
        to: targetDir
      },
      {
        from: path.join(tmpDir, 'dayjs', 'dayjs.min.js'),
        to: targetDir
      },
      {
        from: path.join(tmpDir, 'antd', 'dist', 'antd.min.js'),
        to: targetDir
      },
      {
        from: path.join(tmpDir, 'antd', 'dist', 'reset.css'),
        to: targetDir
      },
      {
        from: path.join(tmpDir, '@ant-design', 'icons', 'dist', 'index.umd.min.js'),
        to: targetDir
      },
      {
        from: path.join(tmpDir, 'ol', 'dist', 'ol.js'),
        to: targetDir
      },
      {
        from: path.join(tmpDir, 'geostyler', 'browser', 'geostyler.css'),
        to: targetDir
      },
      {
        from: path.join(tmpDir, 'geostyler', 'browser', 'geostyler.iife.js'),
        to: targetDir
      },
      {
        from: path.join(tmpDir, 'geostyler-geojson-parser', 'dist', 'geoJsonDataParser.iife.js'),
        to: targetDir
      },
      {
        from: path.join(tmpDir, 'geostyler-sld-parser', 'dist', 'sldStyleParser.iife.js'),
        to: targetDir
      },
      {
        from: path.join(tmpDir, 'geostyler-wfs-parser', 'dist', 'wfsDataParser.iife.js'),
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
