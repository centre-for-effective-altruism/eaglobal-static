// code to make the window scroll smoothly on hash change move back by 
(function($){
  var navHeight = $('#navbar-main').outerHeight() + 20;
  var scrollHash = function(event) {
      scrollBy(0, -navHeight);
  };
  if (location.hash) scrollHash();
  $(window).on("hashchange", scrollHash);

})(jQuery);

// highlight footnotes when they're clicked
(function($){
    var t;
    var removeHighlights = function (timeout) {
        timeout = timeout || false;
        clearTimeout(t);
        $('.footnote-item>p,.footnote-ref').removeClass('highlighted')
        if(timeout) {
            t = setTimeout(function(){removeHighlights()},10000)
        }
    }
    var parent = $(document);
    $(parent).on('click','.footnote-ref a',function(){
        removeHighlights(true);
        $($(this).attr('href')+'>p').addClass('highlighted')
    });
    $(parent).on('click','.footnote-backref',function(){
        removeHighlights(true);
        $($(this).attr('href')).parent('sup').addClass('highlighted')
    });

}(jQuery));

// show and hide the menu bar background/logo depending on whether the main logo is showing
(function($, debounce){
    var mainLogo = $('#header-logo');
    var nav = $('#navbar-main');
    if(!mainLogo.length){
        nav.removeClass('nav-minimal');
        return;
    }
    var logoOffset,navOffset;
    function calculateOffsets(){
        logoOffset = mainLogo.offset().top + (mainLogo.outerHeight() / 2);
        navOffset = nav.offset().top + nav.outerHeight();
    }
    function setNavClasses(){
        if(navOffset < logoOffset){
            nav.addClass('nav-minimal')
        } else {
            nav.removeClass('nav-minimal')
        }
    }
    function run(){
        calculateOffsets();
        setNavClasses();
    }
    run();
    $(document).ready(run);
    $(document).scroll(debounce(100,run));
    $(document).resize(debounce(100,run));
    nav.mouseover(function(){nav.removeClass('nav-minimal')});
    nav.mouseout(run);

}(jQuery, debounce));


// wrapper for `validate` library for consistent form validation handling.
(function( $, validateLib ){
    $.fn.validate = function(rules, callback) {
        if(typeof rules !== 'object' || typeof rules === null){
            throw new Error ('No rules object provided')
        }

        var el = $(this);

        el.on('submit',function(event){
            var el = $(this);
            event.preventDefault();
            if(validate(el,rules)){
                // run the callback if it's been set, otherwise submit the form
                if(typeof callback === 'function'){
                    callback(el);
                } else {
                    el.submit();
                }
            }
        });

        function validate (form,rules){
            var validationErrors = validateLib(form,rules)
            
            if(validationErrors){
                for (var error in validationErrors) {
                    if(validationErrors.hasOwnProperty(error)) {
                        var el = $('[name='+error+']')

                        el.parent('.form-group,.input-group')
                        .addClass('has-error')

                        el
                        .tooltip('hide')
                        .tooltip('destroy')
                        .tooltip({title:validationErrors[error][0],trigger:"manual",placement:"auto bottom"})
                        .tooltip('show')
                        .on('focus change',function(){
                            $(this)
                            .tooltip('hide')
                            .tooltip('destroy');

                            $(this).parent('.form-group,.input-group')
                            .removeClass('has-error');
                        })
                    }
                }
                return false;
            }
            return true;
        }
    }; 
})( jQuery, validate );

(function($){
    var toc = $('#table-of-contents>.table-of-contents-wrapper');
    if(!toc.length) return;
    var nav = $('#navbar-main');
    var content = $('#content');
    var footer = $('#footer');
    function tocAffix(){
        toc.css('width',toc.outerWidth())
        var footerOffset = footer.offset().top;
        toc.affix({
            offset: {
                top: content.offset().top - nav.outerHeight(),
                bottom: footer.outerHeight() + 120
            }
        })
    }

    function createToc(){
        if ($(window).width() >= window.breakpoints.md){
            tocAffix();
            toc.addClass('table-of-contents-scrollspy-active')
        } else {
            $(window).off('.affix');
            toc
            .removeClass("affix affix-top affix-bottom table-of-contents-scrollspy-active")
            .removeData("bs.affix");

        }
    }

    $('body').scrollspy({ target: '.table-of-contents-scrollspy-active', offset: nav.outerHeight() + 120 })
    createToc();

    $(window).on('resize',function(){
        clearTimeout(resizeTimeout);
        var resizeTimeout = setTimeout(createToc,300);
    })

})(jQuery);
