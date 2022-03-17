var shown = false;
function showhideEmail() {
    if (shown){
        document.getElementById('email').innerHTML = "Show my email";
        shown = false;
    }else{
        var myemail = "<a href='mailto:mirandar1" + "@" + "udayton.edu'>mirandar1" + "@" + "udayton.edu</a>";
        document.getElementById('email').innerHTML= myemail;
        shown = true;
    }
}