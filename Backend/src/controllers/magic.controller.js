import * as magicService from '../services/magic.service.js';

export const rewrite = async (req, res) => {
  try {
    const { text, instruction } = req.body;
    if (!text || !instruction) return res.status(400).json({ error: 'Text and instruction required.' });
    
    const result = await magicService.rewriteText(text, instruction);
    res.json({ rewritten: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const generate = async (req, res) => {
  try {
    const { clauseType, context } = req.body;
    if (!clauseType) return res.status(400).json({ error: 'Clause type required.' });

    const result = await magicService.generateClause(clauseType, context);
    res.json({ clause: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const analyze = async (req, res) => {
  try {
    const { documentId } = req.body;
    if (!documentId) return res.status(400).json({ error: 'Document ID required.' });

    const analysis = await magicService.analyzeDocument(documentId);
    res.json({ analysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};