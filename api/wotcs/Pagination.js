var _ = require('underscore');

module.exports = (function(skip, count, limit, link_to){

    var pagination = {
        pages: Math.ceil(count / limit),
        current: Math.floor(skip / limit)+1,
        show: [],

        render: function(url) {
            var render = '<ul class="pagination">';
            render += '<li class="prev'+( this.prev ? '' : ' disabled' )+'">';
            if(this.prev){
                render += link_to('← Previous', url+'skip='+(this.current-2)*limit);
            } else {
                render += '<span>← Previous</span>';
            }
            render += '</li>';

            _(this.show).each(function(page){
                var classes = ['hidden-xxs'];
                if(page == pagination.current)classes.push('active');
                if(page == '...'){
                    classes.push('disabled');
                    classes.push('hidden-xs');
                }
                if(Math.abs(page - pagination.current) > 2 && [1, pagination.pages].indexOf(page) < 0)classes.push('hidden-xs');
                var classString = 'class="'+classes.join(' ')+'"';

                render += '<li '+classString+'>';
                render += link_to(page, page == '...' ? '#':'/clans?skip='+(page-1)*limit);
                render += '</li>';
            });

            render += '<li class="next'+( this.next ? '' : ' disabled' )+'">';
            if(this.next){
                render += link_to('Next →', url+'skip='+(this.current)*limit);
            } else {
                render += '<span>Next →</span>';
            }
            render += '</li></ul>';
            return render;
        }
    };

    pagination.prev = pagination.current > 1;
    pagination.next = pagination.current < pagination.pages;

    var from = Math.max(1, pagination.current-3);
    var to   = Math.min(from + 6, pagination.pages);
    from = Math.max(Math.min(to - 6, from),1);
    for(var j = from; j <= to; j++){
        if(j > 0 && j <= pagination.pages)pagination.show.push(j);
    }
    if(pagination.show.indexOf(3) < 0 &&  pagination.show.indexOf(4) < 0 && 4 < pagination.current)pagination.show.unshift('...');
    else if(pagination.show.indexOf(3) < 0 && 3 < pagination.current)pagination.show.unshift(3);
    if(pagination.show.indexOf(2) < 0 && 2 < pagination.current)pagination.show.unshift(2);
    if(pagination.show.indexOf(1) < 0)pagination.show.unshift(1);
    if(pagination.show.indexOf(pagination.pages-2) < 0 && pagination.show.indexOf(pagination.pages-3) < 0 && pagination.pages-3 > pagination.current)pagination.show.push('...');
    else if(pagination.show.indexOf(pagination.pages-2) < 0 && pagination.pages-2 > pagination.current)pagination.show.push(pagination.pages-2);
    if(pagination.show.indexOf(pagination.pages-1) < 0 && pagination.pages-1 > pagination.current)pagination.show.push(pagination.pages-1);
    if(pagination.show.indexOf(pagination.pages) < 0)pagination.show.push(pagination.pages);

    return pagination;
});