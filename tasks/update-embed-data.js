require('dotenv').load({silent:true});
const Promise = require('bluebird');
const Contentful = require('contentful-content-management');
// var Embedly = require('embedly');
const chalk = require('chalk');
const path = require('path');
const mime = require('mime');
const inspect = require('util').inspect;
const slug = require('slug'); slug.defaults.mode = 'rfc3986';

const urlEmbed = require('url-embed');
const EmbedEngine = urlEmbed.EmbedEngine;
const Embed = urlEmbed.Embed;
 
const embedEngine = new EmbedEngine({
  timeoutMs: 5000,
});
embedEngine.registerDefaultProviders();
// var needle = Promise.promisifyAll(require('needle'));

const contentful = new Contentful();
// var embedly = Promise.promisifyAll(new Embedly());

const tick = chalk.green('✓');

console.log(chalk.inverse('Searching for Contentful entries with missing embed data...'));
contentful.space(function(space){
    var entriesMissingData = [];
    var oembedData = [];
    var publishedEntryIDs = [];

    return space.getEntries({content_type:'talk'})
    .then(function(entries){
        // get info about each entry
        entries.items.forEach(function(entry){
            if ( entry.fields.embedUrl && (!entry.fields.thumbnail || !entry.fields.oembed) ) {
                entriesMissingData.push(entry);
            }

            if(parseInt(entry.sys.publishedVersion,10) === parseInt(entry.sys.version,10) - 1){
                publishedEntryIDs.push(entry.sys.id);
            }
        })
        if(!entriesMissingData.length) {
            // nothing to process, exit this promise chain
            console.log(chalk.yellow('No entries are missing embed data!'));
            return false;
        }
        console.log(chalk.cyan('+'),'Found',chalk.cyan(entriesMissingData.length),'entries with missing embed data');
        // get oEmbed code from each embed
        var embeds = [];
        entriesMissingData.forEach(function(entry){
            embeds.push(new Embed(entry.fields.embedUrl['en-US']));
        });
        return new Promise((resolve, reject) => {
            embedEngine.getMultipleEmbeds(embeds, (err, results) => {
                if (err) {
                    return reject(err);
                }
                resolve(results);
            })
        })
        .then((embeds) => {
            console.log(tick,'Got oEmbed data');
            // flatten responses array
            oembedData = embeds;
        })
        .then(() => {
            // create new assets for each of the talks
            var assets = [];
            entriesMissingData.forEach((entry, i) => {
                // prepare assets for creation
                if(!entry.fields.thumbnail){
                    var imageUrl = oembedData[i].data.thumbnail_url;
                    var title    = entry.fields.title['en-US'];
                    if(!imageUrl) {
                        console.log(inspect(oembedData[i]))
                        throw new TypeError(imageUrl+' is an invalid value for imageUrl')
                    }
                    assets.push(contentful.formatItems({
                        title: `${title} thumbnail image`,
                        file: {
                            fileName: `${slug(title)}-thumb${path.extname(imageUrl)}`,
                            contentType: mime.lookup(imageUrl),
                            upload: imageUrl
                        }
                    }));
                }
                // add missing oembed data
                if(!entry.fields.oembed){
                    entry.fields.oembed = {
                        'en-US': oembedData[i].data
                    }
                }
            });

            var promises = [];
            if(assets.length) {
                promises.push(
                    // container for Promise that creates and assigns assets
                    space.queue('createAsset',assets)
                    .then(function(assets){
                        console.log(tick, 'Created assets');
                        // process all the assets
                        return contentful.itemQueue('processForAllLocales', assets);
                    })
                    .then(function(assets){
                        console.log(tick,'Processed assets');
                        // publish all the assets
                        return contentful.itemQueue('publish', assets);
                    })
                    .then(function(assets){
                        console.log(tick,'Published assets');
                        return assets;
                    })
                    .then(function(assets){
                        // add assets to entries
                        var a = 0;
                        for (var i = 0, j=entriesMissingData.length; i < j; i++) {
                            if(!entriesMissingData[i].fields.thumbnail){
                                entriesMissingData[i].fields.thumbnail = {
                                    'en-US': {
                                        sys: {
                                            type: 'Link',
                                            linkType: 'Asset',
                                            id: assets[a].sys.id
                                        }
                                    }
                                }
                                a += 1;
                            }
                        }
                    })
                );
            }
            return Promise.all(promises);
        })
        .then(function(){
            return contentful.itemQueue('update', entriesMissingData)
            .then(function(entries){
                console.log(tick,'Updated entries');
                // filter any entries that aren't currently published and at the latest version
                var entriesToPublish = entries.filter((entry) => publishedEntryIDs.indexOf(entry.sys.id) !== -1);
                if(!entriesToPublish.length) {
                    console.log(chalk.cyan('+'),'No entries were updated');
                    return false;
                }
                return contentful.itemQueue('publish', entriesToPublish)
                .then(function(entries){
                    console.log(tick,'Published',chalk.cyan(entries.length),'updated entries');
                });
            })
        })
        .then(function(){
            console.log(tick,chalk.green('All done!'));
        })
    })
    .catch(function(err){
        console.error(chalk.red(err));
        throw err;
    })
})
.catch(function(err){
    throw err;
});