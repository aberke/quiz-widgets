/* Builds HTML content of quiz objects 

	Using prototypical form in case there are many quizzes on the page
		- avoid redefining and storing functions in memory for each quiz
*/

var QuizHTMLbuilder = function(quizData, container) {
    this.static_domain = "http://quiz.huffingtonpost.com"; // akamai cache

    this.container = container;
    this.quizData = quizData;
    this.quizID = quizData._id;
    this.quizClassName = ('quiz-' + this.quizID);
    this.onclickPrefix = ("QuizWidgets['" + this.quizID + "']");

    this.stylesheet = document.createElement('style');
    document.body.appendChild(this.stylesheet);

    this.addCustomStyles();
}
QuizHTMLbuilder.prototype.addStyle = function(rule) {
    this.stylesheet.innerHTML += rule;
}
QuizHTMLbuilder.prototype.addCustomStyles = function() {
    var styles = this.quizData.custom_styles;
    if (!styles || typeof styles != "string") { return; }

    /* Don't want the custom_styles to effect styles of any other quiz on the page 
        - add quizClassName infront of each style - replacing .huffpostlabs-quiz if necessary
    */
    styles = ('.' + this.quizClassName + ' ' + styles);

    var re1 = new RegExp('.huffpostlabs-quiz', 'g');
    styles = styles.replace(re1, ('.' + this.quizClassName));

    var strongerRule = ('.' + this.quizClassName + ' ');
    styles = styles.replace(/}\ *.*/g, ('}' + strongerRule));
    // take off the last .quizClassName
    styles = styles.substring(0, styles.length - strongerRule.length);

    /* need to replace all commas in the styles with ,.quizClassName
        but must avoid doing so within a style rule's {} like { color: rgb(0,0,0); }
    */
    var withinStyle = false;
    var i=0;
    while(i < styles.length) {
        var character = styles[i];
        if (character == '{') {
            withinStyle = true;
        } else if (character == '}') {
            withinStyle = false;
        } else if (character == ',' && !withinStyle) {
            styles = styles.substring(0, i+1) + strongerRule + styles.substring(i+1);
        }
        i++;
    }
    //get rid of the duplicates
    var re2 = new RegExp('.' + this.quizClassName + '\ *\n*\ *.' + this.quizClassName, 'g');
    styles = styles.replace(re2, '.' + this.quizClassName);
    this.addStyle(styles);
}

/* ---------------- Helpers to HTML building functions ----------- */
QuizHTMLbuilder.prototype.shortenText = function(text, maxlength) {
    /* helper for sharing to twitter */
    if (text && text.length && text.length > maxlength) {
        text = (text.substring(0, maxlength - 2) + "..");
    }
    return text;
}

/* helpers to questionAnswersContainerHTML */
QuizHTMLbuilder.prototype.answerImageHTML = function(answer) {
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
QuizHTMLbuilder.prototype.answerAddBackgroundImage = function(answer) {
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
/* helpers to questionAnswersContainerHTML */

QuizHTMLbuilder.prototype.textClass = function(text) {
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
/* ---------------- Helpers to HTML building functions above ----------- */

QuizHTMLbuilder.prototype.titleContainerHTML = function() {
    var onclickStart        = this.onclickPrefix + ".startQuiz(this)";
    var onclickShareFB      = this.onclickPrefix + ".shareQuizFB()";
    var onclickShareTwitter = this.onclickPrefix + ".shareQuizTwitter()";
    var onclickShareEmbed   = this.onclickPrefix + ".shareEmbed()";
    
    var html = "<div class='slide title-container'>";
        html+= "    <span class='photo-credit'>" + (this.quizData.pic_credit || "") + "</span>";
        html+= "    <div class='title-content'>";
        html+= "        <h1 class='title'>" + this.quizData.title + "</h1>";
        html+= "        <div class='share-container'>";
        html+= "            <div class='fb-share-container'>";
        html+= "                <img width='30px' height='30px' class='share fb-share-btn touchable' data-huffpostlabs-btn onclick=" + onclickShareFB + " src='" + this.static_domain + "/icon/fb-icon.png'></img>";
        html+= "                <img width='30px' height='30px' class='share fb-share-btn-blue touchable' data-huffpostlabs-btn onclick=" + onclickShareFB + " src='" + this.static_domain + "/icon/fb-icon-blue.png'></img>";
        html+= "            </div>";
        html+= "            <div class='twitter-share-container'>";
        html+= "                <img width='30px' height='30px' data-huffpostlabs-btn onclick=" + onclickShareTwitter + " class='twitter-share-btn share touchable' src='" + this.static_domain + "/icon/twitter-icon.png'></img>";
        html+= "                <img width='30px' height='30px' data-huffpostlabs-btn onclick=" + onclickShareTwitter + " class='twitter-share-btn-blue share touchable' src='" + this.static_domain + "/icon/twitter-icon-blue.png'></img>";
        html+= "            </div>";
        html+= "            <span class='embed-code'>";
        html+= "                <img class='share' src='" + this.static_domain + "/icon/embed.png' onclick=" + onclickShareEmbed + "></img>";
        html+= "            </span>";
        html+= "        </div>";
        html+= "        <div class='start-container touchable' data-huffpostlabs-btn onclick=" + onclickStart + ">";
        html+= "            <h2 class='start-text'>START</h2>";
        html+= "        </div>";
        html+= "    </div>";
        html+= " </div>";
    return html;
}
QuizHTMLbuilder.prototype.answerKeyContainerHTML = function() {
    var onclickRefresh      = this.onclickPrefix + ".refresh()";
    var onclickShareFB      = this.onclickPrefix + ".shareOutcomeFB()";
    var onclickShareTwitter = this.onclickPrefix + ".shareOutcomeTwitter()";

    var html = "<div class='slide answer-key-container'>";
        html+=      "<div class='answer-key-content'>";
        html+=          (this.quizData.extraSlide.blob || '');
        html+=      "</div>";
        html+=      "<div class='share-container'>";
        html+=          "<div class='fb-share-container'>";
        html+= "            <img width='30px' height='30px' class='share fb-share-btn touchable' data-huffpostlabs-btn onclick=" + onclickShareFB + " src='" + this.static_domain + "/icon/fb-icon.png'></img>";
        html+= "            <img width='30px' height='30px' class='share fb-share-btn-blue touchable' data-huffpostlabs-btn onclick=" + onclickShareFB + " src='" + this.static_domain + "/icon/fb-icon-blue.png'></img>";          
        html+=          "</div>            ";
        html+=          "<div class='twitter-share-container'>";
        html+=              "<img width='30px' height='30px' data-huffpostlabs-btn onclick=" + onclickShareTwitter + " class='twitter-share-btn share touchable' src='" + this.static_domain + "/icon/twitter-icon.png'></img>";
        html+=              "<img width='30px' height='30px' data-huffpostlabs-btn onclick=" + onclickShareTwitter + " class='twitter-share-btn-blue share touchable' src='" + this.static_domain + "/icon/twitter-icon-blue.png'></img>";          
        html+=          "</div>";        
        html+=          "<div class='share-text'>";
        html+=              "<p>Share your results</p>";
        html+=          "</div>";
        html+=          "<img width='30px' height='30px' class='refresh-btn touchable' data-huffpostlabs-btn onclick=" + onclickRefresh + " src='" + (this.quizData.refresh_icon_url || (this.static_domain + "/icon/refresh.png")) + "'></img>";
        html+=      "</div>";
        html+= "</div>";
    return html;
}
QuizHTMLbuilder.prototype.questionAnswersContainerHTML = function(question) {
    var onclickAnswer       = this.onclickPrefix + ".answer(this)"; // complemented by data-quiz-answer=ANSWER-INDEX
    var onclickShareFB      = this.onclickPrefix + ".shareQuizFB()";
    var onclickShareTwitter = this.onclickPrefix + ".shareQuizTwitter()";
    var onclickPrevBtn      = this.onclickPrefix + ".previous(this)";

    var html = "<div class='slide'>";
        html+= "    <div class='question-share-container'>";
        html+= "        <div class='previous-btn' data-huffpostlabs-btn onclick=" + onclickPrevBtn + "></div>";
        html+= "        <div class='fb-share-container'>";
        html+= "            <img width='30px' height='30px' class='share fb-share-btn touchable' data-huffpostlabs-btn onclick=" + onclickShareFB + " src='" + this.static_domain + "/icon/fb-icon.png'></img>";
        html+= "            <img width='30px' height='30px' class='share fb-share-btn-blue touchable' data-huffpostlabs-btn onclick=" + onclickShareFB + " src='" + this.static_domain + "/icon/fb-icon-blue.png'></img>";
        html+= "        </div>";
        html+= "        <div class='twitter-share-container'>";
        html+= "            <img width='30px' height='30px' data-huffpostlabs-btn onclick=" + onclickShareTwitter + " class='twitter-share-btn share touchable' src='" + this.static_domain + "/icon/twitter-icon.png'></img>";
        html+= "            <img width='30px' height='30px' data-huffpostlabs-btn onclick=" + onclickShareTwitter + " class='twitter-share-btn-blue share touchable' src='" + this.static_domain + "/icon/twitter-icon-blue.png'></img>";
        html+= "        </div>";
        html+= "    </div>";

        html+= "    <div class='question-answers-container'>";
        html+= "        <div class='question-container'>";
        html+= "            <h2 class='question-text'>" + (question.text || "") + "</h2>";
        html+= "        </div>";
        html+= "        <div class='answers-container total-answers-" + ((question.answerList.length < 5) ? question.answerList.length : 'more') + "' >";

    for (var i=0; i<question.answerList.length; i++) {
        var a = question.answerList[i];
        html+= "            <div data-quiz-answer=" + i + " data-huffpostlabs-btn onclick=" + onclickAnswer + " " + this.answerAddBackgroundImage(a) + " class='touchable answer-container " + a.pic_style + "'>";
        html+=                  this.answerImageHTML(a);
        html+= "                <h3 class='answer-text" + this.textClass(a.text) + "'>" + (a.text || "") + "</h3>";
        html+= "                <span class='photo-credit'>" + (a.pic_credit || "") + "</span>";
        html+= "            </div>";
    }
        html+= "        </div>";
        html+= "    </div>";
        html+= "</div>";
    return html;
}
QuizHTMLbuilder.prototype.outcomeContentHTML = function(outcome) {
    var html = "";
        html+= "    <h1 class='outcome-text" + this.textClass(outcome.text) + "'>" + (outcome.text || "") + "</h1>";
    if ((outcome.pic_style == 'float-right') && outcome.pic_url) {
        html+= "    <img src=" + outcome.pic_url + " />";
    }
        html+= "    <h3 class='outcome-description'>" + (outcome.description || "") + "</h3>";
        html+= "    <span class='photo-credit'>" + (outcome.pic_credit || "") + "</span>";
    return html;
}
QuizHTMLbuilder.prototype.updateOutcomeContent = function(outcome) {
    var outcomeContent = this.container.getElementsByClassName('outcome-content')[0];
    outcomeContent.className = ("outcome-content " + (outcome.pic_style || "bottom-right"));
    
    if (outcome.pic_url && outcome.pic_style != "float-right") {
        outcomeContent.style.backgroundImage = "url(" + outcome.pic_url + ")";
    } else { /* in case it was previously set, then quiz refreshed, need to remove it */
        outcomeContent.style.backgroundImage = "none";
    }
    outcomeContent.innerHTML = this.outcomeContentHTML(outcome);
}
QuizHTMLbuilder.prototype.outcomeContainerHTML = function() {
    var onclickShareFB      = this.onclickPrefix + ".shareOutcomeFB()";
    var onclickShareTwitter = this.onclickPrefix + ".shareOutcomeTwitter()";
    var onclickRefresh      = this.onclickPrefix + ".refresh()";
    var onclickNextSlide    = this.onclickPrefix + ".nextSlide()";


    var html = "<div class='slide outcome-container'>";
        html+= "    <div class='outcome-content'>";
                    /* ---- the outcome content will fill in here --- */
        html+= "    </div>";
        html+= "    <div class='share-container'>";
        html+= "        <div class='fb-share-container'>";
        html+= "            <img width='30px' height='30px' class='share fb-share-btn touchable' data-huffpostlabs-btn onclick=" + onclickShareFB + " src='" + this.static_domain + "/icon/fb-icon.png'></img>";
        html+= "            <img width='30px' height='30px' class='share fb-share-btn-blue touchable' data-huffpostlabs-btn onclick=" + onclickShareFB + " src='" + this.static_domain + "/icon/fb-icon-blue.png'></img>";
        html+= "        </div>";
        html+= "        <div class='twitter-share-container'>";
        html+= "            <img width='30px' height='30px' data-huffpostlabs-btn onclick=" + onclickShareTwitter + " class='twitter-share-btn share touchable' src='" + this.static_domain + "/icon/twitter-icon.png'></img>";
        html+= "            <img width='30px' height='30px' data-huffpostlabs-btn onclick=" + onclickShareTwitter + " class='twitter-share-btn-blue share touchable' src='" + this.static_domain + "/icon/twitter-icon-blue.png'></img>";
        html+= "        </div>";
        html+= "        <div class='share-text'><p>Share your results</p></div>";
    if (this.quizData.type=='trivia-quiz'&&this.quizData.extraSlide) {
        html+= "        <img width='30px' height='30px' class='answer-key-btn touchable' data-huffpostlabs-btn onclick=" + onclickNextSlide + " src='" + this.static_domain + "/icon/key.png'>";            
    }
        html+= "        <img width='30px' height='30px' class='refresh-btn touchable' data-huffpostlabs-btn onclick=" + onclickRefresh + " src='" + (this.quizData.refresh_icon_url || (this.static_domain + "/icon/refresh.png")) + "'></img>";
        html+= "    </div>";
        html+= "</div>";
    return html;
}
QuizHTMLbuilder.prototype.buildWidget = function() {
    /* add background image */
    this.container.className += (' ' + this.quizClassName);
    var backgroundImageStyle = (this.quizData.pic_url ? ('url(' + this.quizData.pic_url + ')') : 'none');
    this.addStyle('.' + this.quizClassName + '::after {background-image:' + backgroundImageStyle + ';}');

    var html = "";
        html+= "<div class='slides-container'>";
        html+= this.titleContainerHTML();

        for(var i=0; i<this.quizData.questionList.length; i++) {
            html += this.questionAnswersContainerHTML(this.quizData.questionList[i]);
        }
        html+= this.outcomeContainerHTML();
    if (this.quizData.type == 'trivia-quiz' && this.quizData.extraSlide) {
        html+= this.answerKeyContainerHTML();   
    }
        html+= "</div>";

    this.container.innerHTML = html;
}