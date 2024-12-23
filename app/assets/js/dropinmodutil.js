const fs = require('fs-extra')
const path = require('path')

const MOD_REGEX = /^(.+(jar|zip|litemod))(?:\.(disabled))?$/
const DISABLED_EXT = '.disabled'

const SHADER_REGEX = /^(.+)\.zip$/
const SHADER_OPTION = /shaderPack=(.+)/
const SHADER_DIR = 'shaderpacks'
const SHADER_CONFIG = 'optionsshaders.txt'

// Liste blanche des mods autorisés
const allowedMods = ['mod1.jar', 'mod2.jar', 'mod3.jar']

/**
 * Validate that the given directory exists. If not, it is
 * created.
 *
 * @param {string} modsDir The path to the mods directory.
 */
exports.validateDir = function(dir) {
    fs.ensureDirSync(dir)
}

/**
 * Scan for drop-in mods in both the mods folder and version
 * safe mods folder.
 *
 * @param {string} modsDir The path to the mods directory.
 * @param {string} version The minecraft version of the server configuration.
 *
 * @returns {{fullName: string, name: string, ext: string, disabled: boolean}[]}
 * An array of objects storing metadata about each discovered mod.
 */
exports.scanForDropinMods = function(modsDir, version) {
    const modsDiscovered = []
    if(fs.existsSync(modsDir)){
        let modCandidates = fs.readdirSync(modsDir)
        let verCandidates = []
        const versionDir = path.join(modsDir, version)
        if(fs.existsSync(versionDir)){
            verCandidates = fs.readdirSync(versionDir)
        }
        for(let file of modCandidates){
            const match = MOD_REGEX.exec(file)
            if(match != null){
                if (allowedMods.includes(match[0])) {
                    modsDiscovered.push({
                        fullName: match[0],
                        name: match[1],
                        ext: match[2],
                        disabled: match[3] != null
                    })
                } else {
                    console.warn(`Mod non autorisé supprimé : ${file}`)
                    fs.unlinkSync(path.join(modsDir, file)) // Supprime le mod non autorisé
                }
            }
        }
        for(let file of verCandidates){
            const match = MOD_REGEX.exec(file)
            if(match != null){
                if (allowedMods.includes(match[0])) {
                    modsDiscovered.push({
                        fullName: path.join(version, match[0]),
                        name: match[1],
                        ext: match[2],
                        disabled: match[3] != null
                    })
                } else {
                    console.warn(`Mod non autorisé supprimé : ${file}`)
                    fs.unlinkSync(path.join(versionDir, file)) // Supprime le mod non autorisé
                }
            }
        }
    }
    return modsDiscovered
}

/**
 * Add drop-in mods.
 * Désactivé pour empêcher l'ajout de mods.
 */
exports.addDropinMods = function(files, modsDir) {
    console.warn('Ajout de mods désactivé.')
    return // Empêche l'ajout de mods
}

/**
 * Delete a drop-in mod from the file system.
 * Désactivé pour empêcher la suppression de mods.
 *
 * @param {string} modsDir The path to the mods directory.
 * @param {string} fullName The fullName of the discovered mod to delete.
 *
 * @returns {Promise.<boolean>} Always false, car désactivé.
 */
exports.deleteDropinMod = async function(modsDir, fullName){
    console.warn('Suppression de mods désactivée.')
    return false // Indique que l'action a échoué
}

/**
 * Toggle a discovered mod on or off.
 * Désactivé pour empêcher les modifications d'état des mods.
 *
 * @param {string} modsDir The path to the mods directory.
 * @param {string} fullName The fullName of the discovered mod to toggle.
 * @param {boolean} enable Whether to toggle on or off the mod.
 *
 * @returns {Promise.<void>} A promise which resolves immédiatement.
 */
exports.toggleDropinMod = function(modsDir, fullName, enable){
    console.warn('Basculement des mods désactivé.')
    return Promise.resolve() // Empêche le basculement sans provoquer d'erreur
}

/**
 * Check if a drop-in mod is enabled.
 *
 * @param {string} fullName The fullName of the discovered mod to toggle.
 * @returns {boolean} True if the mod is enabled, otherwise false.
 */
exports.isDropinModEnabled = function(fullName){
    return !fullName.endsWith(DISABLED_EXT)
}

/* Les fonctions liées aux shaderpacks restent inchangées */


/**
 * Scan for shaderpacks inside the shaderpacks folder.
 *
 * @param {string} instanceDir The path to the server instance directory.
 *
 * @returns {{fullName: string, name: string}[]}
 * An array of objects storing metadata about each discovered shaderpack.
 */
exports.scanForShaderpacks = function(instanceDir){
    const shaderDir = path.join(instanceDir, SHADER_DIR)
    const packsDiscovered = [{
        fullName: 'OFF',
        name: 'Off (Default)'
    }]
    if(fs.existsSync(shaderDir)){
        let modCandidates = fs.readdirSync(shaderDir)
        for(let file of modCandidates){
            const match = SHADER_REGEX.exec(file)
            if(match != null){
                packsDiscovered.push({
                    fullName: match[0],
                    name: match[1]
                })
            }
        }
    }
    return packsDiscovered
}

/**
 * Read the optionsshaders.txt file to locate the current
 * enabled pack. If the file does not exist, OFF is returned.
 *
 * @param {string} instanceDir The path to the server instance directory.
 *
 * @returns {string} The file name of the enabled shaderpack.
 */
exports.getEnabledShaderpack = function(instanceDir){
    exports.validateDir(instanceDir)

    const optionsShaders = path.join(instanceDir, SHADER_CONFIG)
    if(fs.existsSync(optionsShaders)){
        const buf = fs.readFileSync(optionsShaders, {encoding: 'utf-8'})
        const match = SHADER_OPTION.exec(buf)
        if(match != null){
            return match[1]
        } else {
            console.warn('WARNING: Shaderpack regex failed.')
        }
    }
    return 'OFF'
}

/**
 * Set the enabled shaderpack.
 *
 * @param {string} instanceDir The path to the server instance directory.
 * @param {string} pack the file name of the shaderpack.
 */
exports.setEnabledShaderpack = function(instanceDir, pack){
    exports.validateDir(instanceDir)

    const optionsShaders = path.join(instanceDir, SHADER_CONFIG)
    let buf
    if(fs.existsSync(optionsShaders)){
        buf = fs.readFileSync(optionsShaders, {encoding: 'utf-8'})
        buf = buf.replace(SHADER_OPTION, `shaderPack=${pack}`)
    } else {
        buf = `shaderPack=${pack}`
    }
    fs.writeFileSync(optionsShaders, buf, {encoding: 'utf-8'})
}

/**
 * Add shaderpacks.
 *
 * @param {FileList} files The files to add.
 * @param {string} instanceDir The path to the server instance directory.
 */
exports.addShaderpacks = function(files, instanceDir) {

    const p = path.join(instanceDir, SHADER_DIR)

    exports.validateDir(p)

    for(let f of files) {
        if(SHADER_REGEX.exec(f.name) != null) {
            fs.moveSync(f.path, path.join(p, f.name))
        }
    }

}