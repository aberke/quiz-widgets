quiz-widgets
============
<img src="http://www.cosgrovecare.org.uk/wp-content/uploads/2013/08/Quiz_button-small.png"
 alt="quiz-widget logo" align="right" />

Quiz Widget App -- Let's go viral

<http://quizwidget-petri.dotcloud.com>

Who's your spirit hacker?
---
<http://www.huffingtonpost.com/2014/02/27/quiz_n_4869792.html>

Notes
---

before next meeting
- share from every slide
- tie outcome
- be able to weight different outcomes

design feedback
---

- be able to share from every slide -- sometimes i'm inspired to share RIGHT NOW

Changes since meeting with editors
---

- more mobile friendly buttons (with accomanying library)
- photo credit shows on hover
- ability to customize the quiz share link-back via the /social page
- refresh button at end of quiz -- it can be customized on the /new page (with GIFs too!)
- on /new page can toggle between previewing mobile and non-mobile version


TODO
---

- on /new page shouldn't be able to take away an outcome that an answer points to
- editable!
- migrate data: turn old questions with answer1 and answer2 into just answerList stuff
- in widget:
	add other share options -- embed currently commented out (it is also hidden on mobile by the css)
- facebook app still in development mode
- handle case of tie
- deal with resize event?
- write api tests
- write e2e tests
- make nice 404

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
===

