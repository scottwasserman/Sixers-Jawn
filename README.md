# Sixers Jawn
Skill and lambda for my Alexa Skill Sixers Jawn.

I wanted to build a skill to quickly find out the current or last Sixers score and I wanted it to seem like it was coming from a buddy in Philly.

The first step was to figure out how to get the realtime NBA data I needed. This article helped: http://nyloncalculus.com/2015/09/21/guest-post-evan-zamir-on-building-your-own-nba-stats-website
From the article I found out there was a NBA stats api but the trick was figuring out how to access it. 

Then I found this git repo where Eli Uriegas (https://github.com/seemethere) documented all of it:
https://github.com/seemethere/nba_py/wiki/stats.nba.com-Endpoint-Documentation
Thanks man! That still didn't give me all the info I needed so I started writing test scripts to get data back. You can see some of it in the docs directory.

Once I hacked around I found out that I could use the teamgamelog endpoint to find the latest game then use the GameID from that game to get more details at the boxscoresummaryv2 endpoint. In the data from that endpoint I found the current or final score, who won and the current win/loss record.  

Cool, so now I have the data I need I just need to get the bot talking more casually. I didn't want it just regurgitate the score and details so I came up with a number of random phrases that would start the response depending on if the Sixers won or lost. Also created some error messages in case something went wrong in grabbing the data from the NBA API.  Here's what I came up with:
``` JavaScript
var ERROR_MESSAGES = [
    "Dang!",
    "Bummer!",
    "Well that sucks!",
    "Doh!",
    "Dude, Really!",
    "What the!"
];

var WIN_MESSAGES = [
    "Yes!",
    "Alright, Alright, Alright!",
    "Philly in the house!",
    "Philly won up in here!",
    "In your face!",
    "Go Philly!"
];

var LOSE_MESSAGES = [
    "We'll get them next time!",
    "Dang!",
    "Come on Philly!",
    "Sucks!"
];
```
I'll definitely be adding more as time goes on.  Feel free to make a recommendation.

One interesting side note is that Alexa can't understand the word jawn so in the invocation name is actually "sixers john".  This worked perfectly so no biggie but thought I'd mention it if you're wondering why it's documented that way.

I submitted this Skill to the Amazon Alexa app store on 10-28-2016 under the name Sixers Jawn.  I'll update this readme after it's in the store.

This is in no way a complex Alexa skill but hopefully can be a useful example of how to easily incorporate data from a remote API in a node.js-based Lambda.

The Lambda code is in the source directory and the Alexa Skill configuration is in the SpeechAssets directory.  I got this structure from Amazon's tutorial code: https://github.com/amzn/alexa-skills-kit-js


