import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import path from 'path';

const app = express();

// tells the app where to render the static files from 
// i.e. the new build folder that was migrated over
app.use(express.static(path.join(__dirname, '/build')));
app.use(cors());
const PORT = 8000;
const pw = 'Mtndew722!'

//  parses the json object included along with POST request & adds body property
//  to the req paramter of the matching route
app.use(bodyParser.json());

const withDB = async (operations, res) => {
    try {
        const uri = `mongodb+srv://andy:${pw}@blog-eeelj.mongodb.net/test?retryWrites=true&w=majority`;
        const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db('my-blog');

        await operations(db);

        client.close();
    } catch(error) {
        res.status(500).json({ message: 'Error connecting to db', error });
    }
}

app.get('/api/articles/:name', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;

        const articlesInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(articlesInfo);
    }, res);
});

app.post('/api/articles/:name/upvote', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;

        const articlesInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                upvotes: articlesInfo.upvotes + 1,
            },
        });
        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });

        res.status(200).json(updatedArticleInfo);
    }, res);
});

app.post('/api/articles/:name/add-comment', (req, res) => {
    const { username, text } = req.body;
    const articleName = req.params.name;

    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                comments: articleInfo.comments.concat({ username, text }),
            },
        });
        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });

        res.status(200).json(updatedArticleInfo);
    }, res);
});

// all requests that aren't caught by any of the other API routes 
// should be passed on to our app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
});