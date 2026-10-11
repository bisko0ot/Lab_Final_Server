const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
app.set('trust proxy', 1);
const port = process.env.PORT || 5000;

// Rate Limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: { message: 'Too many auth requests, please slow down.' }
});

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(generalLimiter); // apply to all routes

// MongoDB Connection URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6wqb9pz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Fallback local URI for testing/dev if no credentials provided
const localUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ideavault";
const finalUri = (process.env.DB_USER && process.env.DB_PASS && !process.env.DB_USER.includes('your_')) ? uri : localUri;

const client = new MongoClient(finalUri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const db = client.db("ideavaultDB");
const ideasCollection = db.collection("ideas");
const commentsCollection = db.collection("comments");

// Verification Middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'unauthorized access: token missing' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET || 'ideavault_jwt_secret_key_12345', (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: 'forbidden access: token invalid or expired' });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect to database
    // Note: client.connect() is optional from mongodb v4.7 onwards but we'll do it inside db retrieval
    console.log("Connected to MongoDB successfully!");

    // Seed database if empty with 4 demo startup ideas for each key segment
    const count = await ideasCollection.countDocuments();
    if (count === 0) {
      const demoCreator = {
        creatorEmail: "demo@ideavault.com",
        creatorName: "IdeaVault Innovator",
        creatorPhoto: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150",
        createdAt: new Date(),
        commentCount: 0
      };

      const seedIdeas = [
        // Tech Segment (4 ideas)
        {
          title: "CloudSync Pro",
          shortDescription: "High-performance distributed cloud file sync for media workflows.",
          detailedDescription: "CloudSync Pro utilizes multi-threaded parallel uploads and smart delta-sync algorithms to help remote video editors sync heavy files without latency.",
          category: "Tech",
          tags: ["SaaS", "Cloud", "Video Editing"],
          imageUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=600",
          budget: "10,000",
          targetAudience: "Creative agencies and remote video editors",
          problemStatement: "Syncing large raw video files (4K/8K) to the cloud is slow and disrupts collaborative workflows.",
          proposedSolution: "Introduce peer-to-peer local caching combined with cloud-parallel block uploads to bypass single-server bandwidth caps.",
          ...demoCreator
        },
        {
          title: "DevDock",
          shortDescription: "Collaborative containerized IDE with real-time pair programming.",
          detailedDescription: "A fully browser-based coding platform running insulated dev environments where multiple coders can share terminals, run commands, and preview outputs instantly.",
          category: "Tech",
          tags: ["IDE", "Docker", "DevOps"],
          imageUrl: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?q=80&w=600",
          budget: "15,000",
          targetAudience: "Software engineering teams and bootcamps",
          problemStatement: "Setting up local development environments consumes hours of developers' time and causes configuration drift.",
          proposedSolution: "Create standardized container templates that launch instantly in the browser with pre-configured linter and debugger systems.",
          ...demoCreator
        },
        {
          title: "API-Guard",
          shortDescription: "Automated vulnerability scanner for public application interfaces.",
          detailedDescription: "An automated security tool that continuously tests your production APIs against OWASP Top 10 vulnerabilities, providing live remediation guidance.",
          category: "Tech",
          tags: ["Security", "API", "SecOps"],
          imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=600",
          budget: "8,000",
          targetAudience: "FinTech startups and digital health platforms",
          problemStatement: "API endpoints are frequently exposed without proper authentication checks, leading to data breaches.",
          proposedSolution: "Implement continuous fuzzing and signature-based requests that mimic real-world cyberattacks to identify weak routes.",
          ...demoCreator
        },
        {
          title: "DesignCraft Studio",
          shortDescription: "No-code compiler converting vector designs to clean React components.",
          detailedDescription: "An AI-powered design compiler that reads Figma files and outputs fully interactive, styled, and documented React component packages.",
          category: "Tech",
          tags: ["No-Code", "Figma", "React"],
          imageUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=600",
          budget: "12,000",
          targetAudience: "UI/UX designers and front-end developers",
          problemStatement: "Handovers from design to engineering lead to misaligned layouts, bloated code, and delayed release cycles.",
          proposedSolution: "Develop a layout semantic analyzer that parses vector constraints into absolute Tailwind or CSS grid classes.",
          ...demoCreator
        },

        // Health Segment (4 ideas)
        {
          title: "AeroBreath",
          shortDescription: "Smart inhaler system tracking air quality and pollution levels.",
          detailedDescription: "A physical inhaler sleeve paired with a mobile app that warns asthma patients about high PM2.5 levels, ozone, or pollen before they enter risk zones.",
          category: "Health",
          tags: ["MedTech", "IoT", "Asthma"],
          imageUrl: "https://images.unsplash.com/photo-1584036561566-baf241f2c44e?q=80&w=600",
          budget: "25,000",
          targetAudience: "Asthma sufferers and pulmonary health clinics",
          problemStatement: "Patients trigger severe asthma flare-ups because they lack visibility into localized, real-time pollution spikes.",
          proposedSolution: "Build a micro-sensor sleeve that logs coordinate locations, weather metrics, and inhaler usage to generate pollution heatmaps.",
          ...demoCreator
        },
        {
          title: "NutraScan Mobile",
          shortDescription: "Pocket spectral analyzer identifying organic pesticide levels.",
          detailedDescription: "NutraScan uses custom camera filters to identify surface chemical signatures on fresh produce, ensuring clean eating.",
          category: "Health",
          tags: ["Nutrition", "Wellness", "Organic"],
          imageUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=600",
          budget: "14,000",
          targetAudience: "Health-conscious consumers and organic chefs",
          problemStatement: "Chemical pesticides are invisible, and consumers cannot verify organic claims at the grocery counter.",
          proposedSolution: "Leverage multispectral light reflection analysis to match chemical signatures against verified databases.",
          ...demoCreator
        },
        {
          title: "TeleScribe HIPAA",
          shortDescription: "AI clinical transcription system for outpatient providers.",
          detailedDescription: "An AI voice assistant designed to transcribe doctor-patient conversations, filtering out small talk to draft medical notes.",
          category: "Health",
          tags: ["AI", "Clinical", "Transcription"],
          imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600",
          budget: "18,000",
          targetAudience: "Outpatient practitioners and private clinics",
          problemStatement: "Doctors spend over 3 hours a day filling out electronic health records, reducing time spent on patient care.",
          proposedSolution: "Deploy a fine-tuned medical vocabulary transcript engine that converts dialogues into standardized medical charts.",
          ...demoCreator
        },
        {
          title: "SleepSonic Band",
          shortDescription: "Deep sleep optimizer via bone-conduction frequency modulation.",
          detailedDescription: "SleepSonic is a lightweight sleep band that monitors brainwaves and triggers soft auditory beats to extend deep sleep cycles.",
          category: "Health",
          tags: ["Sleep", "IoT", "Biohacking"],
          imageUrl: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=600",
          budget: "20,000",
          targetAudience: "Chronic insomniacs and biohackers",
          problemStatement: "Poor sleep quality costs billions in lost productivity and elevates risks for metabolic disorders.",
          proposedSolution: "Implement real-time EEG analysis synced with bone-conduction speakers to project slow-wave beats at key sleep phases.",
          ...demoCreator
        },

        // AI Segment (4 ideas)
        {
          title: "PredictiveFlow",
          shortDescription: "Logistics demand forecasting platform powered by neural networks.",
          detailedDescription: "An enterprise supply chain tool that analyzes sales velocity, macroeconomic shifts, and shipping times to predict inventory requirements.",
          category: "AI",
          tags: ["Logistics", "Enterprise", "Demand"],
          imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=600",
          budget: "30,000",
          targetAudience: "Global retailers and third-party logistics firms",
          problemStatement: "Retailers lose capital because they either overstock dead items or suffer out-of-stock scenarios on high-demand goods.",
          proposedSolution: "Build a temporal transformer model that predicts granular stock requirements down to specific postal codes.",
          ...demoCreator
        },
        {
          title: "LingoBots Auto",
          shortDescription: "Autonomous translation agents for multi-lingual databases.",
          detailedDescription: "An AI localized catalog manager that translates e-commerce product listings and support documents while preserving local slang and context.",
          category: "AI",
          tags: ["Translation", "NLP", "Localization"],
          imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600",
          budget: "11,000",
          targetAudience: "E-commerce expansion brands and international startups",
          problemStatement: "Standard translations strip context and technical jargon, rendering product catalogs unappealing to global buyers.",
          proposedSolution: "Use multi-turn context parsing models trained on localized market idioms and localized SEO search terms.",
          ...demoCreator
        },
        {
          title: "InsightLens QA",
          shortDescription: "Industrial computer vision scanner for manufacturing lines.",
          detailedDescription: "InsightLens connects high-definition cameras to production lines to detect micro-cracks, alignment shifts, and cosmetic damage in real-time.",
          category: "AI",
          tags: ["Manufacturing", "Vision", "Quality Control"],
          imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600",
          budget: "22,000",
          targetAudience: "Automotive and aerospace component factories",
          problemStatement: "Manual quality assurance misses micro-defects, causing expensive product recalls and warranty claims.",
          proposedSolution: "Deploy high-speed edge computing units running anomaly-detection autoencoders trained on normal product samples.",
          ...demoCreator
        },
        {
          title: "SynthMedia AI",
          shortDescription: "Script-to-video studio converting blog posts to documentaries.",
          detailedDescription: "A generative video studio that digests long articles and produces structured videos with appropriate B-roll footage, scripts, and synthetic voiceovers.",
          category: "AI",
          tags: ["Video", "Generative", "Marketing"],
          imageUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=600",
          budget: "15,000",
          targetAudience: "Content marketers and digital publishers",
          problemStatement: "Video production is expensive and time-consuming, preventing written content creators from entering visual platforms.",
          proposedSolution: "Map textual key-concepts to semantic tags, automatically pull relevant public domain B-roll, and splice them with voiceovers.",
          ...demoCreator
        },

        // Education Segment (4 ideas)
        {
          title: "MathQuest Adaptive",
          shortDescription: "Gamified math program adjusting difficulty dynamically for kids.",
          detailedDescription: "MathQuest turns mathematical calculations into RPG adventures, adjusting level difficulty parameters dynamically based on user response times.",
          category: "Education",
          tags: ["EdTech", "Gamification", "Mathematics"],
          imageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=600",
          budget: "13,000",
          targetAudience: "Primary school educators and homeschooling parents",
          problemStatement: "Traditional math homework is dry, causing children to lose interest or fall behind if they cannot match the class speed.",
          proposedSolution: "Build a game loop where numerical correct answers reward avatars, backed by cognitive speed calculators that adjust equations.",
          ...demoCreator
        },
        {
          title: "UniShare Rentals",
          shortDescription: "Verified student marketplace for digital textbook rentals.",
          detailedDescription: "UniShare is a student-only platform offering cheap textbook rentals, verified study notes, and syllabus study guides.",
          category: "Education",
          tags: ["Textbooks", "University", "Rentals"],
          imageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=600",
          budget: "7,000",
          targetAudience: "College students and university bookstores",
          problemStatement: "College textbooks are overpriced, forcing students to pay massive sums for books they only use for one semester.",
          proposedSolution: "Build a secure PDF rental locker using student email verification, enforcing reading-only access during the rental terms.",
          ...demoCreator
        },
        {
          title: "LangVR Classroom",
          shortDescription: "Immersive VR conversational simulations for language learners.",
          detailedDescription: "LangVR places users in realistic virtual scenarios—like checking into a hotel or ordering food—where they converse with native-speaking AI bots.",
          category: "Education",
          tags: ["Virtual Reality", "Languages", "Simulations"],
          imageUrl: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=600",
          budget: "24,000",
          targetAudience: "Language institutions and self-directed learners",
          problemStatement: "Language learners struggle with conversational confidence because textbooks fail to replicate conversational anxiety.",
          proposedSolution: "Design VR scenes backed by high-accuracy speech-to-text translators and natural language generator dialogue hubs.",
          ...demoCreator
        },
        {
          title: "SkillPath Career",
          shortDescription: "Dynamic skill path designer matching global employment data.",
          detailedDescription: "A career coaching system that scans active global tech job postings to recommend optimal micro-credentials and bootcamps.",
          category: "Education",
          tags: ["Career", "Micro-Credentials", "Bootcamps"],
          imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600",
          budget: "9,000",
          targetAudience: "Career switchers and graduating college seniors",
          problemStatement: "Curriculum designs lag behind market shifts, leading to students studying obsolete toolsets.",
          proposedSolution: "Perform continuous scraper analysis on job sites to score skills and construct step-by-step training paths.",
          ...demoCreator
        }
      ];

      await ideasCollection.insertMany(seedIdeas);
      console.log("Seeded database with initial demo startup ideas.");
    }
  } catch (error) {
    console.error("Database connection/logic error:", error);
  }
}

run().catch(console.dir);

// JWT Generate Route (auth-specific rate limit applied)
    app.post('/jwt', authLimiter, async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET || 'ideavault_jwt_secret_key_12345', {
        expiresIn: '7d'
      });
      res.send({ token });
    });

    // -------------------------------------------------------------
    // IDEAS API ENDPOINTS
    // -------------------------------------------------------------

    // 1. GET /ideas - Fetch ideas with search (title) and category filter
    app.get('/ideas', async (req, res) => {
      try {
        const { search, category, page, limit } = req.query;
        let query = {};

        if (search) {
          query.title = { $regex: search, $options: 'i' };
        }
        if (category && category !== 'All') {
          query.category = category;
        }

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 0; // 0 = no limit (return all)
        const skip = limitNum > 0 ? (pageNum - 1) * limitNum : 0;

        const total = await ideasCollection.countDocuments(query);
        const ideas = await ideasCollection
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .toArray();

        res.send({ ideas, total, page: pageNum, limit: limitNum });
      } catch (error) {
        res.status(500).send({ message: 'Error retrieving ideas', error: error.message });
      }
    });

    // 2. GET /ideas/trending - Limit 6 ideas (sorted by creation date & comments)
    app.get('/ideas/trending', async (req, res) => {
      try {
        // Sort by commentCount descending first, then by createdAt descending, limit 6
        const trending = await ideasCollection
          .find({})
          .sort({ commentCount: -1, createdAt: -1 })
          .limit(6)
          .toArray();
        res.send(trending);
      } catch (error) {
        res.status(500).send({ message: 'Error retrieving trending ideas', error: error.message });
      }
    });

    // 3. GET /ideas/user/:email - Fetch ideas created by a specific user (Protected)
    app.get('/ideas/user/:email', verifyToken, async (req, res) => {
      try {
        const email = req.params.email;
        // Strict ownership check
        if (req.decoded.email !== email) {
          return res.status(403).send({ message: 'Forbidden: Access denied' });
        }
        const query = { creatorEmail: email };
        const result = await ideasCollection.find(query).sort({ createdAt: -1 }).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Error retrieving user ideas', error: error.message });
      }
    });

    // 4. GET /ideas/:id - Fetch details of a single idea (Protected)
    app.get('/ideas/:id', verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const idea = await ideasCollection.findOne(query);
        if (!idea) {
          return res.status(404).send({ message: 'Idea not found' });
        }
        res.send(idea);
      } catch (error) {
        res.status(500).send({ message: 'Error retrieving idea details', error: error.message });
      }
    });

    // 5. POST /ideas - Create new idea (Protected)
    app.post('/ideas', verifyToken, async (req, res) => {
      try {
        const newIdea = req.body;
        // Make sure fields are present and standard
        const ideaToInsert = {
          title: newIdea.title,
          shortDescription: newIdea.shortDescription,
          detailedDescription: newIdea.detailedDescription,
          category: newIdea.category,
          tags: Array.isArray(newIdea.tags) ? newIdea.tags : (newIdea.tags ? newIdea.tags.split(',').map(t => t.trim()) : []),
          imageUrl: newIdea.imageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600',
          budget: newIdea.budget || '',
          targetAudience: newIdea.targetAudience,
          problemStatement: newIdea.problemStatement,
          proposedSolution: newIdea.proposedSolution,
          creatorEmail: req.decoded.email,
          creatorName: newIdea.creatorName || req.decoded.name || 'Anonymous',
          creatorPhoto: newIdea.creatorPhoto || '',
          createdAt: new Date(),
          commentCount: 0
        };

        const result = await ideasCollection.insertOne(ideaToInsert);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ message: 'Error creating idea', error: error.message });
      }
    });

    // 6. PUT /ideas/:id - Update idea (Protected, creator only)
    app.put('/ideas/:id', verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        
        // Find existing idea to verify creator
        const existingIdea = await ideasCollection.findOne(filter);
        if (!existingIdea) {
          return res.status(404).send({ message: 'Idea not found' });
        }
        if (existingIdea.creatorEmail !== req.decoded.email) {
          return res.status(403).send({ message: 'Forbidden: You can only edit your own ideas' });
        }

        const updateData = req.body;
        const updateDoc = {
          $set: {
            title: updateData.title,
            shortDescription: updateData.shortDescription,
            detailedDescription: updateData.detailedDescription,
            category: updateData.category,
            tags: Array.isArray(updateData.tags) ? updateData.tags : (updateData.tags ? updateData.tags.split(',').map(t => t.trim()) : []),
            imageUrl: updateData.imageUrl,
            budget: updateData.budget,
            targetAudience: updateData.targetAudience,
            problemStatement: updateData.problemStatement,
            proposedSolution: updateData.proposedSolution,
            updatedAt: new Date()  // track last modified timestamp
          }
        };

        const result = await ideasCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Error updating idea', error: error.message });
      }
    });

    // 7. DELETE /ideas/:id - Delete idea (Protected, creator only)
    app.delete('/ideas/:id', verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };

        // Verify creator
        const existingIdea = await ideasCollection.findOne(filter);
        if (!existingIdea) {
          return res.status(404).send({ message: 'Idea not found' });
        }
        if (existingIdea.creatorEmail !== req.decoded.email) {
          return res.status(403).send({ message: 'Forbidden: You can only delete your own ideas' });
        }

        // Delete all comments associated with this idea first
        await commentsCollection.deleteMany({ ideaId: id });

        const result = await ideasCollection.deleteOne(filter);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Error deleting idea', error: error.message });
      }
    });

    // -------------------------------------------------------------
    // COMMENTS API ENDPOINTS
    // -------------------------------------------------------------

    // 1. GET /comments/:ideaId - Fetch all comments for an idea
    app.get('/comments/:ideaId', async (req, res) => {
      try {
        const ideaId = req.params.ideaId;
        const result = await commentsCollection
          .find({ ideaId: ideaId })
          .sort({ timestamp: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Error retrieving comments', error: error.message });
      }
    });

    // 2. POST /comments - Add comment (Protected)
    app.post('/comments', verifyToken, async (req, res) => {
      try {
        const commentData = req.body;

        // Validation checks
        if (!commentData.text || !commentData.text.trim()) {
          return res.status(400).send({ message: 'Comment text cannot be empty' });
        }
        if (!commentData.ideaId) {
          return res.status(400).send({ message: 'Idea ID is required' });
        }

        const newComment = {
          ideaId: commentData.ideaId,
          userEmail: req.decoded.email,
          userName: commentData.userName || 'Anonymous',
          userPhoto: commentData.userPhoto || '',
          text: commentData.text,
          timestamp: new Date()
        };

        const result = await commentsCollection.insertOne(newComment);

        // Update comment count on idea
        await ideasCollection.updateOne(
          { _id: new ObjectId(commentData.ideaId) },
          { $inc: { commentCount: 1 } }
        );

        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ message: 'Error creating comment', error: error.message });
      }
    });

    // 3. PUT /comments/:id - Update comment (Protected, owner only)
    app.put('/comments/:id', verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };

        const comment = await commentsCollection.findOne(filter);
        if (!comment) {
          return res.status(404).send({ message: 'Comment not found' });
        }
        if (comment.userEmail !== req.decoded.email) {
          return res.status(403).send({ message: 'Forbidden: You can only edit your own comments' });
        }

        const updateDoc = {
          $set: {
            text: req.body.text,
            timestamp: new Date() // update timestamp to show edited
          }
        };

        const result = await commentsCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Error updating comment', error: error.message });
      }
    });

    // 4. DELETE /comments/:id - Delete comment (Protected, owner only)
    app.delete('/comments/:id', verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };

        const comment = await commentsCollection.findOne(filter);
        if (!comment) {
          return res.status(404).send({ message: 'Comment not found' });
        }
        if (comment.userEmail !== req.decoded.email) {
          return res.status(403).send({ message: 'Forbidden: You can only delete your own comments' });
        }

        const ideaId = comment.ideaId;
        const result = await commentsCollection.deleteOne(filter);

        // Decrement comment count on idea
        await ideasCollection.updateOne(
          { _id: new ObjectId(ideaId) },
          { $inc: { commentCount: -1 } }
        );

        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Error deleting comment', error: error.message });
      }
    });

    // -------------------------------------------------------------
    // INTERACTIONS API ENDPOINTS
    // -------------------------------------------------------------

    // GET /interactions/:email - Retrieve ideas commented on by user (Protected)
    app.get('/interactions/:email', verifyToken, async (req, res) => {
      try {
        const email = req.params.email;
        if (req.decoded.email !== email) {
          return res.status(403).send({ message: 'Forbidden: Access denied' });
        }

        // Aggregate unique ideaIds this user commented on
        const userComments = await commentsCollection
          .find({ userEmail: email })
          .project({ ideaId: 1, _id: 0 })
          .toArray();

        const uniqueIdeaIds = [...new Set(userComments.map(c => c.ideaId))];

        if (uniqueIdeaIds.length === 0) {
          return res.send([]);
        }

        const objectIds = uniqueIdeaIds.map(id => {
          try {
            return new ObjectId(id);
          } catch(e) {
            return null;
          }
        }).filter(id => id !== null);

        const commentedIdeas = await ideasCollection
          .find({ _id: { $in: objectIds } })
          .sort({ createdAt: -1 })
          .toArray();

        res.send(commentedIdeas);
      } catch (error) {
        res.status(500).send({ message: 'Error retrieving user interactions', error: error.message });
      }
    });

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.send({
    status: 'ok',
    uptime: process.uptime().toFixed(2) + 's',
    timestamp: new Date().toISOString()
  });
});

// Root Endpoint
app.get('/', (req, res) => {
  res.send('IdeaVault API Server is running');
});

// Start Server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

module.exports = app;
