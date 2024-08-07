To Get the project running on your setup: 

Install Node.js from the official website

Open Package.json in the project folder and install the required packages using npm I "package-name"


Next step is to setup MongoDB atlas since I am using atlas for my database instead of storing it on my machine

Go to MongoDB atlas, create a new collection and create a new user for the collection and note down the username and password for the user


The last step is to create a .env file (touch .env)

The contents of the file should be: (Note: All the below keys are of the type string)

COOKIE_KEYS= (Create your own cookie key string)

GOOGLE_CLIENT_ID= (Now these would take some time to setup. Go to your google console and create a new web project and copy down the client ID here)

GOOGLE_CLIENT_SECRET= (Copy down the client secret you get after creating the google project here)

MONGODBUSER= (your mongodb username)

MONGODBPASSWORD= (your mongodb password)
