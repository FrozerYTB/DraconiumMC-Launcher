const { DistributionAPI } = require('helios-core/common')

const ConfigManager = require('./configmanager')


exports.REMOTE_DISTRO_URL = 'https://launcher.draconium-mc.ovh/nebula/distribution.json'

const api = new DistributionAPI(
    ConfigManager.getLauncherDirectory(),
    null, // Injected forcefully by the preloader.
    null, // Injected forcefully by the preloader.
    exports.REMOTE_DISTRO_URL,
    false
)

exports.DistroAPI = api