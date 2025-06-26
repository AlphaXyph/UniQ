const Quiz = require("../models/Quiz");

exports.createQuiz = async (req, res) => {
    try {
        const { title, questions } = req.body;
        const createdBy = req.user.id;

        const newQuiz = new Quiz({ title, questions, createdBy });
        await newQuiz.save();
        res.status(201).json({ msg: "Quiz created successfully" });
    } catch (err) {
        res.status(500).json({ msg: "Quiz creation failed" });
    }
};

exports.getAllQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find().select("-questions.answer"); // hide answers for students
        res.json(quizzes);
    } catch (err) {
        res.status(500).json({ msg: "Failed to fetch quizzes" });
    }
};
