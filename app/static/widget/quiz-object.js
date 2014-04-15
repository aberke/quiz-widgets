var HuffpostLabsSlidesCntl = function(container) {
    var container = container;
    var slides;
    var currSlideIndex;
    var currSlide;
    var nextSlide;

    var percentToNumber = function(percentString) {
        return percentString.split('%')[0];
    };

    var transitionPrev = function() {
        
        currSlide.style.top = "100%";
        slides[currSlideIndex - 1].style.top = "0%";
        currSlideIndex -= 1;

        currSlide = slides[currSlideIndex];
        nextSlide = slides[currSlideIndex + 1];
    };

    var transitionNext = function() {
        
        currSlide.style.top = "-100%";
        nextSlide.style.top = "0%";
        currSlideIndex += 1;

        currSlide = slides[currSlideIndex];
        nextSlide = slides[currSlideIndex + 1];
    };

    var init = function() {
        slides = container.getElementsByClassName('slide');
        for(var i=0; i<slides.length; i++) {
            slides[i].style.top = '100%';
        }

        currSlideIndex = 0;

        currSlide = slides[currSlideIndex];
        nextSlide = slides[currSlideIndex + 1];
        currSlide.style.top = '0%';
    }
    return { transitionNext: transitionNext, transitionPrev: transitionPrev, init: init };
}

var HuffpostLabsQuizObject = function(container, quizData) {
    console.log('quizData', quizData)

    var static_domain = "http://quiz.huffingtonpost.com"; // akamai cache


    var container = container;
    var quizData = quizData;
    var quizID = quizData._id;
    var quizClassName = ('quiz-' + quizID);

    var gameLogic;
    var slidesCntl;
    var btnMaster;
    //var outcomeContent;

    //var questionList;
    //var currQuestionIndex;
    //var outcomeMap; // {_outcomeID: outcomeObject}
    //var leadingOutcome; // set to null in init
    var chosenAnswers; // []


    function startQuiz(element) {
        slidesCntl.transitionNext();
        QuizFunctions.quizStarted(quizData);
    }
    function previous() { /* inverse of answer */
        slidesCntl.transitionPrev();
        if (chosenAnswers.length) { /* start button doesn't increment it */
            currQuestionIndex -= 1;
            var previousAnswer = chosenAnswers.pop();
            gameLogic.unchooseAnswer(previousAnswer);
            //decrementOutcome(previousAnswer._outcome); /* decrement after transition because it is expensive iteration and it doesn't matter if user sees previous slide first */
        }
    }
    function answer(huffpostLabsBtn) { /* the onclick handler is on the huffpostLabsBtn marked with the data-huffpostlabs-btn tag */
        var index = huffpostLabsBtn.element.getAttribute('data-quiz-answer');
        var answer = gameLogic.answer(index);
        chosenAnswers.push(answer);

<<<<<<< HEAD
        outcome = gameLogic.outcome(); // returns null if quiz not completed
        if (outcome) {
            updateOutcomeContent(container, outcome);
            completedCallback(quizData, chosenAnswers, outcome);
=======
        if (currQuestionIndex == questionList.length) {
            QuizFunctions.quizCompleted(quizData, leadingOutcome, chosenAnswers);
>>>>>>> master
        }
        slidesCntl.transitionNext();


    }
    function nextSlide() {
        slidesCntl.transitionNext();
    }
    // function incrementOutcome(outcomeID) {
    //     var o = outcomeMap[outcomeID];
    //     o.points += 1;
    //     if (!leadingOutcome || o.points > leadingOutcome.points) {
    //         leadingOutcome = o;
    //         updateOutcomeContent(o);
    //     }
    //     return leadingOutcome;
    // }
    // function decrementOutcome(outcomeID) {
    //     outcomeMap[outcomeID].points -= 1;
    //     for (var outcomeID in outcomeMap) {
    //         if (outcomeMap[outcomeID].points > leadingOutcome.points) {
    //             leadingOutcome = outcomeMap[outcomeID];
    //         }
    //     }
    // }

    function setupSlides() {
        slidesCntl = new HuffpostLabsSlidesCntl(container);
        slidesCntl.init();
    }
    // function createOutcomeMap(outcomeList) {
    //     map = {};
    //     for (var i=0; i<outcomeList.length; i++) {
    //         var o = outcomeList[i];
    //         o.points = 0;
    //         map[o._id] = o;
    //     }
    //     return map;
    // }
    function init(){
        chosenAnswers = [];
        //leadingOutcome = null;
        //questionList = quizData.questionList;
        //currQuestionIndex = 0;
        gameLogic = new QuizLogic(quizData);
        //outcomeMap = createOutcomeMap(quizData.outcomeList);
        addCustomStyles();

        buildWidget();
        setupSlides();
        handleMobile();
<<<<<<< HEAD
        container.style.display = 'block';
=======

>>>>>>> master
    }
    function reloadData(data) {
        quizData = data;
        init();
    }
    function refresh() {
        console.log('refresh')
        //leadingOutcome = null;
        chosenAnswers = [];  /* array of answer objects */
        //currQuestionIndex = 0;
        //outcomeMap = createOutcomeMap(quizData.outcomeList);
        gameLogic.reset();
        slidesCntl.init();
        QuizFunctions.quizRestarted(quizData);
    }

    function handleMobile() {
        /* turn all elements marked with the data-huffpostlabs-btn tag into HuffpostLabsBtns
            Collecting + converting these btns for given context handled by the HuffpostLabsBtnMaster */
        if (QuizMobile) {
            container.className += ' mobile';
        } else {
            container.className += ' non-mobile';
        }
        btnMaster = new HuffpostLabsBtnMaster(container);
    }
    function buildWidget() {
        /* add background image */
        container.className += (' ' + quizClassName);
        var backgroundImageStyle = (quizData.pic_url ? ('url(' + quizData.pic_url + ')') : 'none');
        addStyle('.' + quizClassName + '::after {background-image:' + backgroundImageStyle + ';}');

        var html = "";
            html+= "<div class='slides-container'>";
            html+= titleContainerHTML();

            for(var i=0; i<quizData.questionList.length; i++) {
                html += questionAnswersContainerHTML(quizData.questionList[i]);
            }
            html+= outcomeContainerHTML();
            html+= "</div>";

        container.innerHTML = html;
    }

    var stylesheet = document.createElement('style');
    document.body.appendChild(stylesheet);
    var addStyle = function(rule) {
        stylesheet.innerHTML += rule;
    }
    var addCustomStyles = function() {
        var styles = quizData.custom_styles;
        if (!styles || typeof styles != "string") { return; }

        /* Don't want the custom_styles to effect styles of any other quiz on the page 
            - add quizClassName infront of each style - replacing .huffpostlabs-quiz if necessary
        */
        var re = new RegExp('.' + quizClassName + '\ *\n*.huffpostlabs-quiz', 'g'); // in case I caused '.quizClassname.huffpostlabs-quiz as first part of styles string'
        styles = ('.' + quizClassName + ' ' + styles);
        styles = styles.replace(/}/g, ('}.' + quizClassName));
        styles = styles.replace(re, ('.' + quizClassName));
        // take off the last .quizClassName
        styles = styles.substring(0, styles.length - ('.' + quizClassName).length);

        addStyle(styles);
    }
    function shareFB(quiz, outcome) {
        var shareData = {
            name:       quiz.title,
            link:       (quiz.share.link),
            caption:    (quiz.share.caption      || 'Find out..'),
            picture:    (quiz.share.pic_url      || quiz.pic_url),
            description:(quiz.share.description  || '')
        };
        // outcome related things take precedence over just quiz
        if (outcome) {
            shareData.picture     = (outcome.share.pic_url || outcome.pic_url || shareData.picture);
            shareData.caption     = (outcome.share.caption || 'I got: ' + outcome.text);
            shareData.description = (outcome.share.description || outcome.description || shareData.description);
        }
        QuizFunctions.fbShare(shareData, (outcome ? outcome.share : quiz.share));
    }

    function shareQuizFB() {
        shareFB(quizData);
    }
    function shareOutcomeFB() {
        shareFB(quizData, leadingOutcome);
    }
    function shareQuizTwitter() {
        QuizFunctions.twitterShare(quizData.title, quizData.share);
    }
    function shareOutcomeTwitter() {
        var text = 'I got: ';
        if (quiz.type == 'trivia-quiz') {
            text+= ('')
        }
            text+= (leadingOutcome.text || leadingOutcome.share.caption || shortenText(leadingOutcome.description, 20) || leadingOutcome.pic_url);
            text+= ' -- ' + quizData.title;
        QuizFunctions.twitterShare(text, leadingOutcome.share);
    }
    function shortenText(text, maxlength) {
        /* helper for sharing to twitter */
        if (text && text.length && text.length > maxlength) {
            text = (text.substring(0, maxlength - 2) + "..");
        }
        return text;
    }
    function embedCode() {
        var prompt = "You can put this quiz on your page too!";
            prompt+= "\nSimply insert the embed code snippet";
            prompt+= "\n\nCopy to clipboard: Copy(Ctrl+C), Enter";
        window.prompt(prompt, 
        '<div class="huffpostlabs-quiz" id="' + quizID + '"></div><script src="' + static_domain + '/widget/q.js"></script>');
    }

    function titleContainerHTML() {
        var onclickStart = "QuizWidgets['" + quizID + "'].startQuiz(this)";
        var onclickShareFB = "QuizWidgets['" + quizID + "'].shareQuizFB()";
        var onclickShareTwitter = "QuizWidgets['" + quizID + "'].shareQuizTwitter()";
        var onclickEmbedCode = "QuizWidgets['" + quizID + "'].embedCode()";
        
        var embedString = '<div class="huffpostlabs-quiz" id="' + quizID + '"></div><script src="' + static_domain + '/widget/q.js"></script>';
        
        var html = "<div class='slide title-container'>";
            html+= "    <span class='photo-credit'>" + (quizData.pic_credit || "") + "</span>";
            html+= "    <div class='title-content'>";
            html+= "        <h1 class='title'>" + quizData.title + "</h1>";
            html+= "        <div class='share-container'>";
            html+= "            <div class='fb-share-container'>";
            html+= "                <img width='30px' height='30px' class='share fb-share-btn touchable' data-huffpostlabs-btn onclick=" + onclickShareFB + " src='" + static_domain + "/icon/fb-icon.png'></img>";
            html+= "                <img width='30px' height='30px' class='share fb-share-btn-blue touchable' data-huffpostlabs-btn onclick=" + onclickShareFB + " src='" + static_domain + "/icon/fb-icon-blue.png'></img>";
            html+= "            </div>";
            html+= "            <div class='twitter-share-container'>";
            html+= "                <img width='30px' height='30px' data-huffpostlabs-btn onclick=" + onclickShareTwitter + " class='twitter-share-btn share touchable' src='" + static_domain + "/icon/twitter-icon.png'></img>";
            html+= "                <img width='30px' height='30px' data-huffpostlabs-btn onclick=" + onclickShareTwitter + " class='twitter-share-btn-blue share touchable' src='" + static_domain + "/icon/twitter-icon-blue.png'></img>";
            html+= "            </div>";
            html+= "            <span class='embed-code'>";
            //html+= "                <input value='" + embedString + "' >";
            html+= "                <img class='share' src='" + static_domain + "/icon/embed.png' onclick=" + onclickEmbedCode + "></img>";
            html+= "            </span>";
            html+= "        </div>";
            html+= "        <div class='start-container touchable' data-huffpostlabs-btn onclick=" + onclickStart + ">";
            html+= "            <h2 class='start-text'>START</h2>";
            html+= "        </div>";
            html+= "    </div>";
            html+= " </div>";
        return html;
    }
    function answerAddImage(answer) {
        if (answer.pic_url) {
            if(answer.pic_style == 'bottom-right') {
                return "<img src='" + answer.pic_url + "'/>";
            } else {
                return "";
            }
        } else {
            return "";
        }
    }
    function answerAddBackgroundImage(answer) {
        if (answer.pic_url) {
            if (answer.pic_style == 'bottom-right') {
                return "";
            } else {
                return "style='background-image:url(" + answer.pic_url + ")'";
            }
        } else {
            return "";
        }
    }
    function textClass(text) {
        /* for text > 40 characters, add 'long-text' class.
            for text > 200 characters, add 'extra-long-text' class.
        */
        var c = "";
        if (text) {
            if (text.length > 40) { c += " long-text"; }
            if (text.length > 200) { c += " extra-long-text"; }
        }
        return c;
    }
    function answerKeyContainerHTML() {

    }
    function questionAnswersContainerHTML(question) {
        var onclickAnswer = "QuizWidgets['" + quizID + "'].answer(this)"; // complemented by data-quiz-answer=ANSWER-INDEX

        var onclickStart = "QuizWidgets['" + quizID + "'].startQuiz(this)";
        var onclickShareFB = "QuizWidgets['" + quizID + "'].shareQuizFB()";
        var onclickShareTwitter = "QuizWidgets['" + quizID + "'].shareQuizTwitter()";

        var onclickPrevBtn = "QuizWidgets['" + quizID + "'].previous(this)";

        var html = "<div class='slide'>";
            html+= "    <div class='question-share-container'>";
            html+= "        <div class='previous-btn' data-huffpostlabs-btn onclick=" + onclickPrevBtn + "></div>";
            html+= "        <div class='fb-share-container'>";
            html+= "            <img width='30px' height='30px' class='share fb-share-btn touchable' data-huffpostlabs-btn onclick=" + onclickShareFB + " src='" + static_domain + "/icon/fb-icon.png'></img>";
            html+= "            <img width='30px' height='30px' class='share fb-share-btn-blue touchable' data-huffpostlabs-btn onclick=" + onclickShareFB + " src='" + static_domain + "/icon/fb-icon-blue.png'></img>";
            html+= "        </div>";
            html+= "        <div class='twitter-share-container'>";
            html+= "            <img width='30px' height='30px' data-huffpostlabs-btn onclick=" + onclickShareTwitter + " class='twitter-share-btn share touchable' src='" + static_domain + "/icon/twitter-icon.png'></img>";
            html+= "            <img width='30px' height='30px' data-huffpostlabs-btn onclick=" + onclickShareTwitter + " class='twitter-share-btn-blue share touchable' src='" + static_domain + "/icon/twitter-icon-blue.png'></img>";
            html+= "        </div>";
            html+= "    </div>";

            html+= "    <div class='question-answers-container'>";
            html+= "        <div class='question-container'>";
            html+= "            <h2 class='question-text'>" + (question.text || "") + "</h2>";
            html+= "        </div>";
            html+= "        <div class='answers-container total-answers-" + ((question.answerList.length < 5) ? question.answerList.length : 'more') + "' >";

        for (var i=0; i<question.answerList.length; i++) {
            var a = question.answerList[i];
            html+= "            <div data-quiz-answer=" + i + " data-huffpostlabs-btn onclick=" + onclickAnswer + " " + answerAddBackgroundImage(a) + " class='touchable answer-container " + a.pic_style + "'>";
            html+=                  answerAddImage(a);
            html+= "                <h3 class='answer-text" + textClass(a.text) + "'>" + (a.text || "") + "</h3>";
            html+= "                <span class='photo-credit'>" + (a.pic_credit || "") + "</span>";
            html+= "            </div>";
        }
            html+= "        </div>";
            html+= "    </div>";
            html+= "</div>";
        return html;
    }
    function outcomeContentHTML(outcome) {
        var html = "";
        if (quizData.type == 'trivia-quiz'){
            html+= ("    <h1 class='trivia-results'>" + gameLogic.correct() + "/" + quizData.questionList.length + " correct</h1>");
        }
            html+= "    <h1 class='outcome-text" + textClass(outcome.text) + "'>" + (outcome.text || "") + "</h1>";
        if ((outcome.pic_style == 'float-right') && outcome.pic_url) {
            html+= "    <img src=" + outcome.pic_url + " />"
        }
            html+= "    <h3 class='outcome-description'>" + (outcome.description || "") + "</h3>";
            html+= "    <span class='photo-credit'>" + (outcome.pic_credit || "") + "</span>";
        return html;
    }
    function updateOutcomeContent(container, outcome) {
        var outcomeContent = container.getElementsByClassName('outcome-content')[0];
        outcomeContent.className = ("outcome-content " + (outcome.pic_style || "bottom-right"));
        
        if (outcome.pic_url && outcome.pic_style != "float-right") {
            outcomeContent.style.backgroundImage = "url(" + outcome.pic_url + ")";
        } else { /* in case it was previously set, need to remove it */
            // TODO: TAKE OUT??
            outcomeContent.style.backgroundImage = "none";
        }
        outcomeContent.innerHTML = outcomeContentHTML(outcome);
    }
    function outcomeContainerHTML() {
<<<<<<< HEAD
        var onclickShareFB = "quizWidgets['" + quizID + "'].shareOutcomeFB()";
        var onclickShareTwitter = "quizWidgets['" + quizID + "'].shareOutcomeTwitter()";
        var onclickRefresh = "quizWidgets['" + quizID + "'].refresh()";
        var onclickNextSlide = "quizWidgets['" + quizID + "'].nextSlide()";
=======
        var onclickShareFB = "QuizWidgets['" + quizID + "'].shareOutcomeFB()";
        var onclickShareTwitter = "QuizWidgets['" + quizID + "'].shareOutcomeTwitter()";
        var onclickRefresh = "QuizWidgets['" + quizID + "'].refresh()";
>>>>>>> master

        var html = "<div class='slide outcome-container'>";
            html+= "    <div class='outcome-content'>";
                        /* ---- the outcome content will fill in here --- */
            html+= "    </div>";
            html+= "    <div class='share-container'>";
            html+= "        <div class='fb-share-container'>";
            html+= "            <img width='30px' height='30px' class='share fb-share-btn touchable' data-huffpostlabs-btn onclick=" + onclickShareFB + " src='" + static_domain + "/icon/fb-icon.png'></img>";
            html+= "            <img width='30px' height='30px' class='share fb-share-btn-blue touchable' data-huffpostlabs-btn onclick=" + onclickShareFB + " src='" + static_domain + "/icon/fb-icon-blue.png'></img>";
            html+= "        </div>";
            html+= "        <div class='twitter-share-container'>";
            html+= "            <img width='30px' height='30px' data-huffpostlabs-btn onclick=" + onclickShareTwitter + " class='twitter-share-btn share touchable' src='" + static_domain + "/icon/twitter-icon.png'></img>";
            html+= "            <img width='30px' height='30px' data-huffpostlabs-btn onclick=" + onclickShareTwitter + " class='twitter-share-btn-blue share touchable' src='" + static_domain + "/icon/twitter-icon-blue.png'></img>";
            html+= "        </div>";
            html+= "        <div class='share-text'><p>Share your results</p></div>";
        if (quizData.type=='trivia-quiz'&&quizData.extraSlide) {
            html+= "        <img width='30px' height='30px' class='answer-key-btn touchable' data-huffpostlabs-btn onclick=" + onclickNextSlide + " src='/icon/key.png'>";            
        }
            html+= "        <img width='30px' height='30px' class='refresh-btn touchable' data-huffpostlabs-btn onclick=" + onclickRefresh + " src='" + (quizData.refresh_icon_url || (static_domain + "/icon/refresh.png")) + "'></img>";
            html+= "    </div>";
            html+= "</div>";
        return html;
    }

    init();
    return{ startQuiz: startQuiz,
            previous: previous,
            answer:   answer,

            nextSlide:          nextSlide,
            refresh:            refresh,
            shareQuizFB:        shareQuizFB,
            shareOutcomeFB:     shareOutcomeFB,
            shareQuizTwitter:   shareQuizTwitter,
            embedCode:          embedCode,
            shareOutcomeTwitter:shareOutcomeTwitter,

            reloadData: reloadData,
            };
}