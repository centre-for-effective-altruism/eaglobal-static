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

	return space.getEntries({content_type:'talk'})
	.then(function(entries){
		console.log('Got',entries.items.length,'entries')
		var updatedEntries = entries.items.map((entry) => {
			delete entry.fields.oembed;
			return entry;
		})
		return contentful.itemQueue('update',updatedEntries)
		.then(function(entries){
			console.log('updated')
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