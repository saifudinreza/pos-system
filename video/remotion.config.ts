import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setCodec("h264");
// yuv420p (rentang warna TV) supaya aman diputar di semua browser dan HP
Config.setPixelFormat("yuv420p");
