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
        a quizHTMLbuilder (quiz-HTML-builder.js)
    - QuizLogic uses prototypical inheritance pattern (quiz-logic.js) -- reasoning in file
    - Reasoning for why objects in this file use classical rather than prototype pattern:
        No good reason - just to mix it up I guess - bad?
*/
var HuffpostLabsQuizObject = function(container, quizData) {
    console.log('quizData', quizData)


    var container = container;
    var quizData = quizData;
    var quizID = quizData._id;


    var quizLogic;
    var quizHTMLbuilder;
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
            quizHTMLbuilder.updateOutcomeContent(outcome);
            QuizFunctions.quizCompleted(quizData, outcome, chosenAnswers);
        }
        slidesCntl.transitionNext();
    }
    function nextSlide() {
        slidesCntl.transitionNext();
    }

    function _setupSlides() {
        slidesCntl = new HuffpostLabsSlidesCntl(container);
        slidesCntl.init();
    }
    function _init(){
        chosenAnswers = [];
        
        if (quizData.type == 'trivia-quiz') {
            quizLogic = new TriviaQuizLogic(quizData);
        } else {
            quizLogic = new DefaultQuizLogic(quizData);
        }
        quizHTMLbuilder = new QuizHTMLbuilder(quizData, container);

        quizHTMLbuilder.buildWidget();
        _setupSlides();
        _handleMobile();
    }
    function reloadData(data) {
        quizData = data;
        _init();
    }
    function refresh() {
        console.log('refresh')
        chosenAnswers = [];  /* array of answer objects */
        quizLogic.reset();
        slidesCntl.init();
        QuizFunctions.quizRestarted(quizData);
    }

    function _handleMobile() {
        /* turn all elements marked with the data-huffpostlabs-btn tag into HuffpostLabsBtns
            Collecting + converting these btns for given context handled by the HuffpostLabsBtnMaster */
        if (QuizMobile) {
            container.className += ' mobile';
        } else {
            container.className += ' non-mobile';
        }
        btnMaster = new HuffpostLabsBtnMaster(container);
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
    function shareEmbed() {
        var prompt = "You can put this quiz on your page too!";
            prompt+= "\nSimply insert the embed code snippet";
            prompt+= "\n\nCopy to clipboard: Copy(Ctrl+C), Enter";

        var code   = '<div class="huffpostlabs-quiz" id="' + quizData._id + '"></div>';
            code  += '<script src="http://code.huffingtonpost.com/widget/q.js"></script>';
            code  += '<p id="labs-credit"><a href="http://code.huffingtonpost.com">Quiz widget by <img height="23px" src="http://code.huffingtonpost.com/img/huffpostLABS_outline.png" /></a></p>';
        window.prompt(prompt, code);
    }

    _init();
    return { 
            startQuiz: startQuiz,
            previous: previous,
            answer:   answer,

            nextSlide:          nextSlide,
            refresh:            refresh,
            shareQuizFB:        shareQuizFB,
            shareOutcomeFB:     shareOutcomeFB,
            shareQuizTwitter:   shareQuizTwitter,
            shareEmbed:         shareEmbed,
            shareOutcomeTwitter:shareOutcomeTwitter,

            reloadData: reloadData,
        };
}