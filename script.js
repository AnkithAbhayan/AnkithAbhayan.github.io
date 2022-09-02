function change_gradient() {
    var array = [
        'linear-gradient(120deg, rgb(229, 255, 0) 0%, rgb(0, 183, 255) 100%)',
        'linear-gradient(120deg, rgb(0, 255, 255) 0%, rgb(247, 0, 255) 100%)',
        'linear-gradient(120deg, rgb(255, 145, 0) 0%, rgb(0, 255, 106) 100%)'      
    ];
    var index = array.indexOf(document.body.style.backgroundImage);
    if (index+1 == array.length) {
        index = 0;
    } else if (index == -1){
        index = 1;
    } else {
        index += 1;
    }
    var newbackground = array[index]
    document.body.style.backgroundImage = newbackground;
    document.body.style.color = "black";
    for (i=0; i!=document.body.getElementsByTagName('hr').length; i++) {
        document.body.getElementsByTagName('hr')[i].setAttribute('style', 'background-color:rgb(25, 25, 25)');
    };                
    for (i=0; i!=document.body.getElementsByTagName('img').length; i++) {
        if (document.body.getElementsByTagName('img')[i].alt == "GitHub logo") {
            document.body.getElementsByTagName('img')[i].src = "logos/GitHub_black.png";
        } else if (document.body.getElementsByTagName('img')[i].alt == "Reddit logo") {
            document.body.getElementsByTagName('img')[i].src = "logos/Reddit_black.png";
        } else if (document.body.getElementsByTagName('img')[i].alt == "Discord logo") {
            document.body.getElementsByTagName('img')[i].src = "logos/Discord_black.png";
        }
    };
};
function mode_change() {
    document.body.style.backgroundImage = 'linear-gradient(120deg, rgb(20, 20, 20) 0%, rgb(20, 20, 20) 100%)';
    document.body.style.color = 'rgb(225, 225, 225)';
    for (i=0; i!=document.body.getElementsByTagName('hr').length; i++) {
        document.body.getElementsByTagName('hr')[i].setAttribute('style', 'background-color:rgb(255, 255, 255)');
    };
    /*document.body.getElementsByClassName('mode_change_button').innerHTMl = "Set Light Mode";
    console.log(document.body.getElementsByClassName('mode_change_button').innerHTMl);*/
    for (i=0; i!=document.body.getElementsByTagName('img').length; i++) {
        if (document.body.getElementsByTagName('img')[i].alt == "GitHub logo") {
            document.body.getElementsByTagName('img')[i].src = "logos/GitHub_green.png";
        } else if (document.body.getElementsByTagName('img')[i].alt == "Reddit logo") {
            document.body.getElementsByTagName('img')[i].src = "logos/Reddit_green.png";
        } else if (document.body.getElementsByTagName('img')[i].alt == "Discord logo") {
            document.body.getElementsByTagName('img')[i].src = "logos/Discord_green.png";
        }
    };
    document.body.style.color = "lime";
    for (i=0; i!=document.body.getElementsByTagName('hr').length; i++) {
        document.body.getElementsByTagName('hr')[i].setAttribute('style', 'background-color:rgb(0, 200, 0)');
    };
}