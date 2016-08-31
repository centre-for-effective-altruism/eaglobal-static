var talkData = [
  {"id":"5uDwjlUdoRU", "title": "The Replication Crisis"},
  {"id":"1EZ1b7fcMbg", "title": "Doing Philanthropy Better"},
  {"id":"T1wK0rSn3CM", "title": "Beyond Malaria"},
  {"id":"zgEXg2ew1-Q", "title": "Engineering Revolutions"},
  {"id":"1hCtmR3VDwE", "title": "Opportunities in Science & Technology Policy"},
  {"id":"jYMTRipfCp4", "title": "Flowthrough Effects"},
  {"id":"PZ6yfPxp7gE", "title": "Government Driven Science & Technology"},
  {"id":"hsOINhyL-gM", "title": "Engaging Developing Country Governments"},
  {"id":"-JkbuDM8otI", "title": "Data-Driven Movement Building"},
  {"id":"41RhSYQw5Nc", "title": "Basic Income: The GiveDirectly Experiment"},
  {"id":"4wmQltExTP8", "title": "Aggregating Knowledge"},
  {"id":"efLEBgMnr8Y", "title": "How much evidence is enough?"},
  {"id":"NB_edlOrPOU", "title": "Should EAs do Policy?"},
  {"id":"okjfvIqIvns", "title": "The End of Poverty"},
  {"id":"Dk3ZP8ZrpyY", "title": "Avian Cognition & Animal Welfare"},
  {"id":"R-VNlXJpAIQ", "title": "Risks and Benefits of Advanced AI"},
  {"id":"D2SwES3r9Kg", "title": "Closing Session: Will MacAskill"},
  {"id":"skS9ube2ov8", "title": "From Behavioral Economics to Public Policy"},
  {"id":"GAvq7B-_xzY", "title": "Forecasting"},
  {"id":"AJiRQVgEg_Y", "title": "Rethinking Meat and the End of Factory Farming"},
  {"id":"qgdUC9XqOaQ", "title": "Creating Effective Policies"},
  {"id":"iydhmbxV6UE", "title": "Past, Present and Future of EA"}
];


const Contentful = require('contentful-content-management');
const slug = require('slug'); slug.defaults.mode = 'rfc3986';

const contentful = new Contentful();

contentful.space((space) => {
	console.log('Opened the space');
	var talks = talkData.map((talk) => {
		return {
		title: talk.title,
		slug: slug(talk.title),
		embedUrl: 'https://www.youtube.com/watch?v=' + talk.id,
		event: {
            sys: {
                type: 'Link',
                linkType: 'Entry',
                id: '4n5vRupVmM2oa0yKmYgeIe'
            }                
		}
	}});
	talks = contentful.formatItems(talks)
	space.queue('createEntry','talk',talks)
	.then(function(talks){
		console.log('created talks!');
	})
});