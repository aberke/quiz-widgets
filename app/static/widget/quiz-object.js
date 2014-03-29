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

var HuffpostLabsQuizObject = function(container, quizData, mobile, startedCallback, completedCallback) {
    console.log('quizData', quizData)

    var static_domain = "http://quiz.huffingtonpost.com"; // akamai cache


    var container = container;
    var outcomeContent;
    var quizData = quizData;
    var isMobile = mobile;
    var quizID = quizData._id;

    var slidesCntl;
    var btnMaster;

    var questionList;
    var currQuestionIndex;
    var outcomeMap; // {_outcomeID: outcomeObject}
    var leadingOutcome; // set to null in init
    var chosenAnswers; // []


    function startQuiz(element) {
        element.onclick = null;
        slidesCntl.transitionNext();
        startedCallback(quizData);
    }
    function previous() { /* inverse of answer */
        slidesCntl.transitionPrev();
        if (chosenAnswers.length) {
            currQuestionIndex -= 1; /* start button doesn't increment it */
            var previousAnswer = chosenAnswers.pop();
            decrementOutcome(previousAnswer._outcome); /* decrement after transition because it is expensive iteration and it doesn't matter if user sees previous slide first */
        }
    }
    function answer(huffpostLabsBtn) { /* the onclick handler is on the huffpostLabsBtn marked with the data-huffpostlabs-btn tag */
        // TODO element.onclick = null;
        var index = huffpostLabsBtn.element.getAttribute('data-quiz-answer');
        var a = questionList[currQuestionIndex].answerList[index];
        chooseAnswer(a);
    }
    function chooseAnswer(answer) {
        chosenAnswers.push(answer);
        incrementOutcome(answer._outcome); /* increment before transition because next slide might be outcome slide */
        currQuestionIndex += 1;
        slidesCntl.transitionNext();

        if (currQuestionIndex == questionList.length) {
            completedCallback(quizData, leadingOutcome, chosenAnswers);
        }
    }
    function incrementOutcome(outcomeID) {
        var o = outcomeMap[outcomeID];
        o.points += 1;
        if (!leadingOutcome || o.points > leadingOutcome.points) {
            leadingOutcome = o;
            updateOutcomeContent(o);
        }
        return leadingOutcome;
    }
    function decrementOutcome(outcomeID) {
        outcomeMap[outcomeID].points -= 1;
        for (var outcomeID in outcomeMap) {
            if (outcomeMap[outcomeID].points > leadingOutcome.points) {
                leadingOutcome = outcomeMap[outcomeID];
            }
        }
    }

    function setupSlides() {
        slidesCntl = new HuffpostLabsSlidesCntl(container);
        slidesCntl.init();
    }
    function createOutcomeMap(outcomeList) {
        map = {};
        for (var i=0; i<outcomeList.length; i++) {
            var o = outcomeList[i];
            o.points = 0;
            map[o._id] = o;
        }
        return map;
    }
    function init(){
        chosenAnswers = [];
        leadingOutcome = null;
        questionList = quizData.questionList;
        currQuestionIndex = 0;
        outcomeMap = createOutcomeMap(quizData.outcomeList);

        container.style.display = 'none';
        buildWidget();
        setupSlides();
        handleMobile();

        container.style.display = 'block';
    }
    function reloadData(data) {
        quizData = data;
        init();
    }
    function refresh() {
        console.log('refresh')
        leadingOutcome = null;
        chosenAnswers = [];  /* array of answer objects */
        currQuestionIndex = 0;
        outcomeMap = createOutcomeMap(quizData.outcomeList);
        slidesCntl.init();
    }

    function handleMobile() {
        /* turn all elements marked with the data-huffpostlabs-btn tag into HuffpostLabsBtns
            Collecting + converting these btns for given context handled by the HuffpostLabsBtnMaster */
        if (isMobile) {
            container.className += ' mobile';
        } else {
            container.className += ' non-mobile';
        }
        btnMaster = new HuffpostLabsBtnMaster(container);
    }
    function buildWidget() {
        /* add background image */
        var newClassName = 'quiz-' + quizID;
        container.className += (' ' + newClassName);
        if (quizData.pic_url) {
            addStyle('.' + newClassName + '::after {background-image: url(' + quizData.pic_url + ');}');
        }

        var html = "";
            html+= "<div class='slides-container'>";
            html+= titleContainerHTML();

            for(var i=0; i<questionList.length; i++) {
                html += questionAnswersContainerHTML(questionList[i]);
            }
            html += outcomeContainerHTML();
            html+= "</div>";

        container.innerHTML = html;
        outcomeContent = container.getElementsByClassName('outcome-content')[0];
    }

    var stylesheet = document.createElement('style');
    document.body.appendChild(stylesheet);
    var addStyle = function(rule) {
        stylesheet.innerHTML += rule;
    }

    function shareQuizFB() {
        fbShareQuiz(quizData);
    }
    function shareOutcomeFB() {
        fbShareOutcome(quizData, leadingOutcome);
    }
    function shareQuizTwitter() {
        twitterShare(quizData.title, quizData.share);
    }
    function shareOutcomeTwitter() {
        var text = 'I got: ';
            text+= (leadingOutcome.text || leadingOutcome.share.caption || shortenText(leadingOutcome.description, 20) || leadingOutcome.pic_url);
            text+= ' -- ' + quizData.title;
        twitterShare(text, leadingOutcome.share);
    }
    function shortenText(text, maxlength) {
        /* helper for sharing to twitter */
        if (text && text.length && text.length > maxlength) {
            text = (text.substring(0, maxlength - 2) + "..");
        }
        return text;
    }
    function copyToClipboard(text) {
      window.prompt("Copy to clipboard: Ctrl+C, Enter", text);
    }
    function embedCode() {
        window.prompt("Copy to clipboard: Copy(Ctrl+C), Enter", 
        '<div class="huffpostlabs-quiz" id="' + quizID + '"></div><script src="' + static_domain + '/widget/q.js"></script>');
    }

    function titleContainerHTML() {
        var onclickStart = "quizWidgets['" + quizID + "'].startQuiz(this)";
        var onclickShareFB = "quizWidgets['" + quizID + "'].shareQuizFB()";
        var onclickShareTwitter = "quizWidgets['" + quizID + "'].shareQuizTwitter()";
        var onclickEmbedCode = "quizWidgets['" + quizID + "'].embedCode()";
        
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
            html+= "                <input value='" + embedString + "' >";
            html+= "                <img src='" + static_domain + "/icon/embed.png' onclick=" + onclickEmbedCode + "></img>";
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
    function questionAnswersContainerHTML(question) {
        var onclickAnswer = "quizWidgets['" + quizID + "'].answer(this)"; // complemented by data-quiz-answer=ANSWER-INDEX

        var onclickStart = "quizWidgets['" + quizID + "'].startQuiz(this)";
        var onclickShareFB = "quizWidgets['" + quizID + "'].shareQuizFB()";
        var onclickShareTwitter = "quizWidgets['" + quizID + "'].shareQuizTwitter()";

        var onclickPrevBtn = "quizWidgets['" + quizID + "'].previous(this)";

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
            html+= "    <h1 class='outcome-text" + textClass(outcome.text) + "'>" + (outcome.text || "") + "</h1>";
        if ((outcome.pic_style == 'float-right') && outcome.pic_url) {
            html+= "    <img src=" + outcome.pic_url + " />"
        }
            html+= "    <h3 class='outcome-description'>" + (outcome.description || "") + "</h3>";
            html+= "    <span class='photo-credit'>" + (outcome.pic_credit || "") + "</span>";
        return html;
    }
    function updateOutcomeContent(outcome) {
        outcomeContent.className = ("outcome-content " + (outcome.pic_style || "bottom-right"));
        if (outcome.pic_style != "float-right") {
            outcomeContent.style.backgroundImage = "url(" + outcome.pic_url + ")";
        }
        outcomeContent.innerHTML = outcomeContentHTML(outcome);
    }
    function outcomeContainerHTML() {
        var onclickShareFB = "quizWidgets['" + quizID + "'].shareOutcomeFB()";
        var onclickShareTwitter = "quizWidgets['" + quizID + "'].shareOutcomeTwitter()";
        var onclickRefresh = "quizWidgets['" + quizID + "'].refresh()";

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
            html+= "        <img width='30px' height='30px' class='refresh-btn touchable' data-huffpostlabs-btn onclick=" + onclickRefresh + " src='" + (quizData.refresh_icon_url || (static_domain + "/icon/refresh.png")) + "'></img>";
            html+= "    </div>";
            html+= "</div>";
        return html;
    }

    init();
    return{ startQuiz: startQuiz,
            previous: previous,
            answer:   answer,

            refresh:            refresh,
            shareQuizFB:        shareQuizFB,
            shareOutcomeFB:     shareOutcomeFB,
            shareQuizTwitter:   shareQuizTwitter,
            embedCode:          embedCode,
            shareOutcomeTwitter:shareOutcomeTwitter,

            reloadData: reloadData,
            };
}