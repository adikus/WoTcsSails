$(function () {
    // Set up clickable rows for whole page
    setUpClickable('');
});

/**
 * Creates link on whole table row (except td's with 'nolink' class)
 * First td in a row has to contain 'a' tag with href which points to desired location
 */
function setUpClickable(selector) {
    $(selector + ' tr.clickable').each(function () {
        var anchor = $(this).find('td:first a');
        var link = anchor.attr('href');
        $(this).find('td').click(function () {
            if (!$(this).hasClass('nolink')) {
                if ($(anchor).attr('target') == '_blank') {
                    window.open(link);
                } else {
                    console.log(link);
                    window.location = link;
                }
                return false;
            }
        });
    });
}