quiz-widgets
============
<img src="http://www.cosgrovecare.org.uk/wp-content/uploads/2013/08/Quiz_button-small.png"
 alt="quiz-widget logo" align="right" />

Quiz Widget App -- Let's go viral

<http://quizwidget-petri.dotcloud.com>

Who's your spirit hacker?
---
<http://www.huffingtonpost.com/2014/02/27/quiz_n_4869792.html>



Changes since meeting with editors
---

- Each question can have 2-4 answers! 
	- still working on ability to create unlimited number of answers (it's a styling issue)
- ability to customize image positioning for each answer on the /new page
- sharing buttons on every question
- more mobile friendly buttons (with accomanying library)
- photo credit shows on hover
- ability to customize the quiz share link-back via the /social page
- refresh button at end of quiz 
	- it can be customized on the /new page (with GIFs too!)
- on /new page can toggle between previewing mobile and non-mobile version

since last email
---
- back button
- outcomes have descriptions
- can go back and edit your quizzes
- outcome pic styling
- user feedback when images are large on the /new and /edit pages


TODO
---

- making login smarter 
	- redirect to previous page on login callback
	- but make sure it doesn't go to /forbidden
		- got to page BEFORE /forbidden

- mongo issue
	- am I properly deleting questions and outcomes and answers?
		- do I also need to splice from quiz.questionList when I delete a question?

- need to better handle reporting completed quizzes
	- grab all answers for given quiz and then sort through them?
	- use embedded documents in mongo instead?  to better handle performance for reporting answers?

- login stuff
	- restrict access on front end too 
		- http://blog.brunoscopelliti.com/deal-with-users-authentication-in-an-angularjs-web-app

	- get rid of basic auth and instead have a whitelist of allowed user twitterIDs/twitter_usernames that i'll check in the middleware find-or-create method
		- whitelist just json that i can update when someone wants an account
		- special user-accounts branch for updating whitelist

- give each user a page
	- find all users page in directory
	- make user's name clickable next to their quiz in the all quizzes view

- different views for my quizzes vs all quizzes:
	- idea:
		- always use the same HTLM partial (current name: all-quizzes.html)
		- restrict the quizzes of that partial -- something like:
			- q in user.quizList for the user quizzes
			- q in quizList for all quizzes | {q._user: '!user._id'}


- put all the fb sharing stuff in its own 'library as external script'
	- for labs reuse

- stats page:
	- total tally for all answers -- as requested by ethan


- http://debug0.huffingtonpost.com/mobile/v1/entries/5030064?device=v6,ios,small,hires&format=html

- fix for trivia option (Nick on the politics team would like this)
	- option to have 1 answer
	- assign arbitrary number of points to outcome
	
- deal with possibility that twitter share link could be too long
	- on sharing page let them put in bitly link for sharing -- or automatically create one

- be able to reorder questions

- deal with linger image in background

- finish up with >4 answers

- embed code as sharing option
	- make better


- finish e2e tests for /edit and /new
	- e2e tests for outcomes

- make nicer instructions on /new and /edit
	- highlight on hover over item on left side

- Deal with Mongo Issues:
	- migrate data: turn old questions with answer1 and answer2 into just answerList stuff
	- there are orphaned documents because previously was not correctly handling DELETEquiz.  AKA There are questions, answers, outcomes, shares, that belong to a no longer existing quiz.
- add other share options 
	- embed currently not functional
	- mail should be easy
- facebook app still in development mode
- handle case of tie
- deal with resize event?
- write api tests
- write e2e tests
- make nice 404

- put widget in a custom web component?

Styling TODO for Wenting
---
- QA styles on each browser
	- use ngrok to test on phones too
	- font doensn't look right on firefox
- Design for unlimited answers

Further Ideas
---

- Make poll product as well:
	- Last slide would load in the oncomplete data to be able to show what other people answered

Button notes
---
Using btn-master.js to make mobile friendly buttons.  All our buttons have data tag data-huffpostlabs-btn in order to make them mobile friendly.

I turned this into a library with documentation: <http://aberke.github.io/huffpostlabs-btn/>

To use the button master when writing widget code:

- complement all ```onclick="onclickstring"``` with the ```data-huffpostlabs-btn``` tag.
- create a ```HuffpostLabsBtnMaster``` to convert your buttons: ```var myBtnMaster = new HuffpostLabsBtnMaster(context)``` where context is the HTML container that contains your buttons.
- HuffpostLabsBtnMaster will find all of the elements with the ```data-huffpostlabs-btn```, grab each elements onclick handler, and retrofit each element with better event handling that calls that handler.


necessary e2e tests
---

- quiz always gets result that it should
- all of the directives
- can only get to certain pages if logged in

neccessary api tests
---

- on creating question, make sure answers point to valid outcomes
	- outcome exists and belongs to the quiz that the question belongs to

Unresolved Issues
---

- Quizzes will not show up in MT live preview
	- MT is under HTTPS
	- quizzes must stay under HTTP so they can load in their arbitrary assets



