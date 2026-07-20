import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/User.js";

const generateAccessCookie = (user, res) => {
  const token = user.generateAccessToken();
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  };
  res.cookie("accessToken", token, options);
  return token;
};

const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;


  if (!username || !password) {
    throw new ApiError(400, "Username and password are required");
  }

  const user = await User.findOne({ username: username.toLowerCase().trim() });
  console.log("Found user:", user); // does it find the user at all?

  if (!user) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const token = generateAccessCookie(user, res);
  
  const loggedInUser = await User.findById(user._id).select("-passwordHash");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: loggedInUser,
        token,
      },
      "User logged in successfully"
    )
  );
});

const logoutUser = asyncHandler(async (req, res) => {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

export { loginUser, logoutUser, getCurrentUser };
