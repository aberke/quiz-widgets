quiz-widgets
============
<img style="max-width:300px" src="http://quizwidget-petri.dotcloud.com/img/example-quiz-screenshot.png"
 alt="quiz-widget logo" align="right" />

Quiz Tool live: <http://bit.ly/huffpostlabs-quiz>

* The quiz tool allows anyone to make a mobile-friendly quiz widget.
	- The Quiz creator is given an embed code after creation to embed on their HTML page

* Scores of Huffpost editors have created quizzes.  Some have gone viral.
	- Example: <http://www.huffingtonpost.com/2014/04/21/geography-quiz_n_5175289.html>


Running Locally
---

- Clone this repo
- Install node
- Install and run mongo
- ```$ cd app```
- Install the dependencies from ```package.json```: ```$ npm install``` 
- Run the server: ```$ node server.js```
- Notes: 
	- Need to set the following environment variables to allow signin with twitter:
		- TWITTER_CONSUMER_KEY 
		- TWITTER_CONSUMER_SECRET
		- Use the HuffpostLabs quiz-widgets twitter app or create a new twitter app to get these keys
	- May need to toggle ```domain``` within ```app/static/widget/q.js``` between commits to production


Running The Tests
---

From within ```/app``` run 
```$ NODE_ENV='testing' mocha```


Running in Production
---

- Currently run on Dotcloud under the HuffpostLabs account
- App logic is within ```/app```
	- Outer directory mainly for dotcloud configuration
- The following files and directories are necessary in their respective places for running on dotcloud, but are not necessary to the app
	- ```/.dotcloudgitignore```
	- ```dotcloud.yml```
	- ```/app/prebuild.sh```
	- ```supervisord.conf```
	- ```/.dotcloud``` (not necessary - just directs CLI to push with git)
- Huffpost DevOps has set up an Akamai cache for us
	- ```quiz.huffingtonpost.com``` cached and fetches data from ```http://quizwidget-petri.dotcloud.com/```
	- The cache is to cache assets that would be requested by /widget/q.js for a quiz -- these are the items that could be requested hundreds of times at once when a quiz goes live on a Huffpost Page
	- .ttf, .png files cached for an hour
	- .css, .js extensions cached for 10 minutes
		- Any GET data is actually a .js asset, since it is requested with a JSONP request
		- That means any time an editor saves changes on the /edit page, changes will take up to 10 minutes to go live.
	- Note: A quiz references URLs for images that we do not host - can't cache these

TODO
---

- get rid of any fields needed for backwards compatibility
	- go into mongo to transfer the data and then update the model
	- the only fields that matter are the count fields
		- Easy solution: could just get rid of these fields without going into mongo and the earlier quizzes will just drasticaly under report stats
- trivia documentation	
- deal with possibility that twitter share link could be too long
	- on sharing page let them put in bitly link for sharing -- or automatically create one
- be able to reorder questions
- finish up with >4 answers



Documentation notes
---
Anyone can add documentation by making a Google Doc!

Advantages:

- Once documentation is published, it can continue to be edited via the google doc
	- these edits are automatically republished
- Don't need to know HTML or anything about the inner workings of the app to write documentation

How it works:

- I have a JSON file mapping ```{document-name: url for the iframe} ```
- All that needs to happen to get to that document under /documentation/document-name is for Alex or someone to update that JSON file


Admin
---
There is an ADMIN_WHITELIST to allow admin users access to the pages and API endpoints that are usually private to the quiz owner

- Right now, HuffpostLabs is the only user with admin rights
- To give a user admin rights:
	- find their user _id in 1 of 2 ways:
		- query /api/user/all and search for their name until you find their user object
		- go to their user page by clicking on their name next to one of their quizzes.  The user _id is the id at the end of the URL you are taken to.
	- copy their user _id
	- add it to the ADMIN_WHITELIST defined in config.js


- Whitelist defined in config.js
- Whitelist used in /middleware/authentication-middleware


Button notes
---
Using btn-master.js to make mobile friendly buttons.  All our buttons have data tag data-huffpostlabs-btn in order to make them mobile friendly.

I turned this into a library with documentation: <http://aberke.github.io/huffpostlabs-btn/>

To use the button master when writing widget code:

- complement all ```onclick="onclickstring"``` with the ```data-huffpostlabs-btn``` tag.
- create a ```HuffpostLabsBtnMaster``` to convert your buttons: ```var myBtnMaster = new HuffpostLabsBtnMaster(context)``` where context is the HTML container that contains your buttons.
- HuffpostLabsBtnMaster will find all of the elements with the ```data-huffpostlabs-btn```, grab each elements onclick handler, and retrofit each element with better event handling that calls that handler.


Unresolved Issues
---

- Quizzes will not show up in MT live preview
	- MT is under HTTPS
	- quizzes must stay under HTTP so they can load in their arbitrary assets

