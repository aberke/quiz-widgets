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
    return { 
        transitionNext: transitionNext, 
        transitionPrev: transitionPrev, 
        init: init,
    };
}
/*
HuffpostLabsQuizObject -- The main object that does the work
    Owns 
        a BtnMaster (btn-master.js or http://aberke.github.io/huffpostlabs-btn/)
        a SlideCntl
        a QuizLogic (quiz-logic.js)
    - QuizLogic uses prototypical inheritance pattern (quiz-logic.js) -- reasoning in file
    - Reasoning for why HuffpostLabsQuizObject does not use prototypical inheritance pattern:
        There is a lot of interaction between the window and this object
            - need to keep hold on each quizData
            - relevant methods need to know which quizData they are using and which slides they are modifying
        - BUT this file should still be refactored
*/
var HuffpostLabsQuizObject = function(container, quizData) {
    console.log('quizData', quizData)

    var static_domain = "http://quiz.huffingtonpost.com"; // akamai cache


    var container = container;
    var quizData = quizData;
    var quizID = quizData._id;
    var quizClassName = ('quiz-' + quizID);
    var onclickPrefix = ("QuizWidgets['" + quizID + "']");


    var quizLogic;
    var slidesCntl;
    var btnMaster;
    
    var chosenAnswers; // [] -- data sent back to server on completion


    function startQuiz() {
        slidesCntl.transitionNext();
        QuizFunctions.quizStarted(quizData); // logging callback
    }
    function previous() { /* inverse of answer */
        slidesCntl.transitionPrev();
        if (chosenAnswers.length) { /* start button doesn't increment it */
            var previousAnswer = chosenAnswers.pop();
            quizLogic.unchooseAnswer(previousAnswer);
        }
    }
    function answer(huffpostLabsBtn) { /* the onclick handler is on the huffpostLabsBtn marked with the data-huffpostlabs-btn tag */
        var index = huffpostLabsBtn.element.getAttribute('data-quiz-answer');
        var answer = quizLogic.answer(index);
        chosenAnswers.push(answer);
        
        var outcome = quizLogic.outcome(); // returns null if quiz not completed
        if (outcome) {
            console.log('outcome',outcome)
            updateOutcomeContent(container, outcome);
            QuizFunctions.quizCompleted(quizData, outcome, chosenAnswers);
        }
        slidesCntl.transitionNext();
    }
    function nextSlide() {
        slidesCntl.transitionNext();
    }

    function setupSlides() {
        slidesCntl = new HuffpostLabsSlidesCntl(container);
        slidesCntl.init();
    }
    function init(){
        chosenAnswers = [];
        
        if (quizData.type == 'trivia-quiz') {
            quizLogic = new TriviaQuizLogic(quizData);
        } else {
            quizLogic = new DefaultQuizLogic(quizData);
        }

        addCustomStyles();

        buildWidget();
        setupSlides();
        handleMobile();
    }
    function reloadData(data) {
        quizData = data;
        init();
    }
    function refresh() {
        console.log('refresh')
        chosenAnswers = [];  /* array of answer objects */
        quizLogic.reset();
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
        if (quizData.type == 'trivia-quiz' && quizData.extraSlide) {
            html+= answerKeyContainerHTML();   
        }
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
            var outcomeShare = (outcome.share || {});
            shareData.picture     = (outcomeShare.pic_url     || outcome.pic_url || shareData.picture);
            shareData.caption     = (outcomeShare.caption     || 'I got: ' + outcome.text);
            shareData.description = (outcomeShare.description || outcome.description || shareData.description);
        }
        QuizFunctions.fbShare(shareData, ((outcome&&outcome.share) ? outcome.share : quiz.share));
    }

    function shareQuizFB() {
        shareFB(quizData);
    }
    function shareOutcomeFB() {
        shareFB(quizData, quizLogic.outcome());
    }
    function shareQuizTwitter() {
        QuizFunctions.twitterShare(quizData.title, quizData.share);
    }
    function shareOutcomeTwitter() {
        var outcome = quizLogic.outcome();
        var text = 'I got: ';
        if (outcome.share && outcome.share.caption) {
            text+= outcome.share.caption;
        } else {
            text+= (outcome.text || shortenText(outcome.description, 20) || outcome.pic_url);
        }
        text+= ' -- ' + quizData.title;
        QuizFunctions.twitterShare(text, (outcome.share || quizData.share));
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
        var onclickStart        = onclickPrefix + ".startQuiz(this)";
        var onclickShareFB      = onclickPrefix + ".shareQuizFB()";
        var onclickShareTwitter = onclickPrefix + ".shareQuizTwitter()";
        var onclickEmbedCode    = onclickPrefix + ".embedCode()";
        
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
        var onclickRefresh      = onclickPrefix + ".refresh()";
        var onclickShareFB      = onclickPrefix + ".shareOutcomeFB()";
        var onclickShareTwitter = onclickPrefix + ".shareOutcomeTwitter()";

        var html = "<div class='slide answer-key-container'>";
            html+=      "<div class='answer-key-content'>";
            html+=          (quizData.extraSlide.blob || '');
            html+=      "</div>";
            html+=      "<div class='share-container'>";
            html+=          "<div class='fb-share-container'>";
            html+= "            <img width='30px' height='30px' class='share fb-share-btn touchable' data-huffpostlabs-btn onclick=" + onclickShareFB + " src='" + static_domain + "/icon/fb-icon.png'></img>";
            html+= "            <img width='30px' height='30px' class='share fb-share-btn-blue touchable' data-huffpostlabs-btn onclick=" + onclickShareFB + " src='" + static_domain + "/icon/fb-icon-blue.png'></img>";          
            html+=          "</div>            ";
            html+=          "<div class='twitter-share-container'>";
            html+=              "<img width='30px' height='30px' data-huffpostlabs-btn onclick=" + onclickShareTwitter + " class='twitter-share-btn share touchable' src='" + static_domain + "/icon/twitter-icon.png'></img>";
            html+=              "<img width='30px' height='30px' data-huffpostlabs-btn onclick=" + onclickShareTwitter + " class='twitter-share-btn-blue share touchable' src='" + static_domain + "/icon/twitter-icon-blue.png'></img>";          
            html+=          "</div>";        
            html+=          "<div class='share-text'>";
            html+=              "<p>Share your results</p>";
            html+=          "</div>";
            html+=          "<img width='30px' height='30px' class='refresh-btn touchable' data-huffpostlabs-btn onclick=" + onclickRefresh + " src='" + (quizData.refresh_icon_url || (static_domain + "/icon/refresh.png")) + "'></img>";
            html+=      "</div>";
            html+= "</div>";
        return html;
    }
    function questionAnswersContainerHTML(question) {
        var onclickAnswer       = onclickPrefix + ".answer(this)"; // complemented by data-quiz-answer=ANSWER-INDEX
        var onclickShareFB      = onclickPrefix + ".shareQuizFB()";
        var onclickShareTwitter = onclickPrefix + ".shareQuizTwitter()";
        var onclickPrevBtn      = onclickPrefix + ".previous(this)";

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
        // if (quizData.type == 'trivia-quiz'){
        //     html+= ("    <h1 class='trivia-results'>You got " + outcome.correct_count + " out of " + outcome.total_count + "</h1>");
        // }
            html+= "    <h1 class='outcome-text" + textClass(outcome.text) + "'>" + (outcome.text || "") + "</h1>";
        if ((outcome.pic_style == 'float-right') && outcome.pic_url) {
            html+= "    <img src=" + outcome.pic_url + " />";
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
        } else { /* in case it was previously set, then quiz refreshed, need to remove it */
            outcomeContent.style.backgroundImage = "none";
        }
        outcomeContent.innerHTML = outcomeContentHTML(outcome);
    }
    function outcomeContainerHTML() {
        var onclickShareFB      = onclickPrefix + ".shareOutcomeFB()";
        var onclickShareTwitter = onclickPrefix + ".shareOutcomeTwitter()";
        var onclickRefresh      = onclickPrefix + ".refresh()";
        var onclickNextSlide    = onclickPrefix + ".nextSlide()";


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
            html+= "        <img width='30px' height='30px' class='answer-key-btn touchable' data-huffpostlabs-btn onclick=" + onclickNextSlide + " src='" + static_domain + "/icon/key.png'>";            
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
            init: init
            };
}