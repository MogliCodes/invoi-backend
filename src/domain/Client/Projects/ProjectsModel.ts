import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  user: {
    type: String,
    required: true,
  },
});

const ProjectSchema = mongoose.model("Project", projectSchema);

export default ProjectSchema;
