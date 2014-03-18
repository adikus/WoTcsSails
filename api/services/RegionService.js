module.exports = {
    RU: 0,
    EU: 1,
    NA: 2,
    SEA: 3,
    VN: 4,
    KR: 5,

    supportedRegions: [
        0,1,2,3,5
    ],

    bounds: {
        0: {min: 0, max: 500000000},
        1: {min: 500000000, max: 1000000000},
        2: {min: 1000000000, max: 2000000000},
        3: {min: 2000000000, max: 2500000000},
        4: {min: 2500000000, max: 3000000000},
        5: {min: 3000000000, max: 4000000000}
    },

    TranslatedRegion: ['RU','EU','NA','SEA','VN','KR'],

    getRegion: function (id) {
        if(id > 3000000000){return this.KR;}
        if(id > 2500000000){return this.VN;}
        if(id > 2000000000){return this.SEA;}
        if(id > 1000000000){return this.NA;}
        if(id > 500000000){return this.EU;}
        return this.RU;
    },

    getHost: function(region) {
        switch(region){
            case 0:
                return 'worldoftanks.ru';
                break;
            case 1:
                return 'worldoftanks.eu';
                break;
            case 2:
                return 'worldoftanks.com';
                break;
            case 3:
                return 'worldoftanks.asia';
                break;
            case 4:
                return 'portal-wot.go.vn';
                break;
            case 5:
                return 'worldoftanks.kr';
                break;
        }
        return '';
    },

    emblemUrl: function(id, size) {
        var region = this.getRegion(id);
        size = size || '64x64';
        return "http://clans."+this.getHost(region)+"/media/clans/emblems/cl_"+id.toString().slice(-3)+"/"+id+"/emblem_"+size+".png"
    }
};