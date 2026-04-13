const File = require('../File');

// Returns the Gemini SDK formatted tool declarations
const getGeminiToolDeclarations = () => {
    return [
        {
            name: "readFile",
            description: "Reads the contents of a file inside the user's workspace based on the fileName path. Use this to understand existing code before modifying.",
            parameters: {
                type: "OBJECT",
                properties: {
                    fileName: { type: "STRING", description: "The exact path or name of the file (e.g. client/src/App.js)." }
                },
                required: ["fileName"]
            }
        },
        {
            name: "writeFile",
            description: "Creates a new file or completely overwrites an existing file with new content. Use this to write code for the user.",
            parameters: {
                type: "OBJECT",
                properties: {
                    fileName: { type: "STRING", description: "The path or name of the file to create or update." },
                    content: { type: "STRING", description: "The full source code content to write." }
                },
                required: ["fileName", "content"]
            }
        },
        {
            name: "listFiles",
            description: "Lists all files and directories in the user's workspace. Use this to understand the project structure.",
            parameters: {
                type: "OBJECT",
                properties: {
                    searchQuery: { type: "STRING", description: "Optional filter string." }
                }
            }
        }
    ];
};

// Execute the requested tool from the AI
const executeTool = async (functionName, args, userId) => {
    try {
        switch (functionName) {
            case "readFile": {
                // Find file in DB
                // In Kevryn architecture, file names might just be strings in the DB
                const file = await File.findOne({ owner: userId, name: { $regex: new RegExp(args.fileName, 'i') } });
                if (!file) return { error: `File ${args.fileName} not found in workspace.` };
                return { content: file.content || "/* Empty File */" };
            }
            case "writeFile": {
                let file = await File.findOne({ owner: userId, name: args.fileName });
                if (file) {
                    file.content = args.content;
                    await file.save();
                } else {
                    file = new File({
                        name: args.fileName,
                        type: 'file',
                        content: args.content,
                        owner: userId,
                        parentId: 'root'
                    });
                    await file.save();
                }
                return { success: true, message: `Successfully wrote ${args.content.length} characters to ${args.fileName}` };
            }
            case "listFiles": {
                const files = await File.find({ owner: userId }, 'name type');
                const list = files.map(f => `${f.type === 'folder' ? '📁' : '📄'} ${f.name}`);
                return { files: list };
            }
            default:
                return { error: `Tool ${functionName} is not recognized.` };
        }
    } catch (e) {
        return { error: `Execution crashed: ${e.message}` };
    }
};

module.exports = {
    getGeminiToolDeclarations,
    executeTool
};
