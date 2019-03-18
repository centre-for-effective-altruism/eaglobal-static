
const Contentful = require('contentful-content-management');
const slug = require('slug'); slug.defaults.mode = 'rfc3986';
const chalk = require('chalk');
const moment = require('moment');
const Promise = require('bluebird');
const Slack = require('slack-node');

const fs = Promise.promisifyAll(require('fs'));
const path = require('path');

const tick = chalk.green('✓');

const contentful = new Contentful();

const slack = Promise.promisifyAll(new Slack());
slack.setWebhook(process.env.SLACK_WEBHOOK_URL);

function getRoleNameFromEvent(event) {
    return `${event.fields.title['en-US']} Editor`;
}

console.log(chalk.blue.inverse('Creating EAGx user roles in Contentful...'));
contentful.space((space) => {
    var events;
    var roles;
    var upcomingEvents = [];
    var pastEvents = [];
    console.log('Opened the space');
    space.getEntries({
        'content_type':'event',
        'fields.eventType':'EAGx',
        'locale':'en-US'
    })
    .then((entries) => {
        events = entries.items;
        console.log(tick,`Found ${events.length} EAGx events`);
        events.forEach( (entry) => {
            if (entry.fields.endDate) {
                if (moment(entry.fields.endDate['en-US']).isAfter(moment().subtract(14,'d'),'day')) {
                    upcomingEvents.push(entry)
                    return;
                }
                pastEvents.push(entry);
                return;
            } 
            upcomingEvents.push(entry)
        });
    })
    .then(() => {

        return space.getRoles()
        .then((roleCollection) => {
            roles = roleCollection.items;
            console.log(`Found ${chalk.cyan(roles.length)} existing roles`);
        })
        .then(() => {
            // get rid of any previous roles
            var pastEventRoleNames = pastEvents.map((event) => getRoleNameFromEvent(event))
            var existingEAGxRoles = roles.filter((role) => pastEventRoleNames.indexOf(role.name) > -1);
            if (existingEAGxRoles.length) {
                console.log(`Warning: found ${chalk.cyan(existingEAGxRoles.length)} roles corresponding to past EAGx events`);
                const message = `Warning, ${existingEAGxRoles.length} EAGx role${existingEAGxRoles.length>1?'s':''} should be removed from Contentful (${existingEAGxRoles.map((event) => event.name).join(', ')})`
                return slack.webhookAsync({
                  channel: "#tech-notifications",
                  username: "eag-role-bot",
                  text: message,
                  icon_emoji: ':no_pedestrians:'
                });
            }
            console.log(chalk.dim(`No old roles to delete!`));
        })
        .then(() => fs.readFileAsync(path.join(__dirname,'create-eagx-roles-default-role.json')))
        .then((defaultsJSON) => {
            var defaultPoliciesAndPermissions = defaultsJSON.toString();
            var newEAGxRoles = upcomingEvents
                .filter((event) => (roles.map((role) => role.name).indexOf(getRoleNameFromEvent(event))=== -1))
                .map((event) => {
                    var perms = JSON.parse(defaultPoliciesAndPermissions.replace(/<%DOCUMENTID%>/g,event.sys.id));
                    return Object.assign({
                        name: getRoleNameFromEvent(event),
                        description: `Can edit the ${event.fields.title['en-US']} event, as well as creating assets and speakers related to the event.`
                    },perms);
                });
            console.log(`Creating ${chalk.cyan(newEAGxRoles.length)} new roles`);


            var succesfullyCreatedRoleNames = [];
            return Promise.all(
                newEAGxRoles.map((role) => {
                    console.log(chalk.yellow('>'),`Creating `,role.name)
                    return space.createRole(role)
                    .then((role) => {
                        console.log(tick,`created `,role.name)
                        succesfullyCreatedRoleNames.push(role.name);
                    })
                    .catch((err) => {
                        console.log(chalk.red(`Error creating ${role.name}`));
                        console.log(chalk.red(err));
                    });
                })
            )
            .then(() => {
                if(succesfullyCreatedRoleNames.length){
                    const message = `${succesfullyCreatedRoleNames.length} new EAGx Editor role${succesfullyCreatedRoleNames.length>1?'s were':' was'} created (${succesfullyCreatedRoleNames.join(', ')})`;
                    slack.webhookAsync({
                      channel: "#tech-notifications",
                      username: "eag-role-bot",
                      text: message,
                      icon_emoji: ':bust_in_silhouette:'
                    });
                }
            })
        })
    })
    .catch( (err) => {
        console.log(chalk.red(err));
        throw err;
    })
    
});
