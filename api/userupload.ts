import express  from "express";
import multer from "multer";
import path from "path";
import mysql from "mysql";
import { conn } from "../dbconnet";
//router = ตัวจัดการเส้นทาง
export const router = express.Router();




const firebaseConfig = {
    apiKey: "AIzaSyBhuVgmc1U5l8WvDfMtZUUONxkNp3QtFRc",
    authDomain: "foodrate-101roi-et.firebaseapp.com",
    projectId: "foodrate-101roi-et",
    storageBucket: "foodrate-101roi-et.appspot.com",
    messagingSenderId: "932396135284",
    appId: "1:932396135284:web:b4d8da7bc3ec3f57eeb221",
    measurementId: "G-YKWBWP84N6"
  };

import {initializeApp} from "firebase/app";
import { getStorage,ref,uploadBytesResumable,getDownloadURL} from "firebase/storage"
//Connect to fire base
initializeApp(firebaseConfig);
//Connect to Storage
const storage = getStorage();


// Middleware save to memory
class FileMiddleware {
    //Attribute of class
  filename = "";
   //Attribute diskloader for saving file to disk
  public readonly diskLoader = multer({
    // storage = saving file to memory
    storage: multer.memoryStorage(),
    // limit file size
    limits: {
      fileSize: 67108864, // 64 MByte
    },
  });
}

//Post /upload + file 
const fileupload = new FileMiddleware();
router.post("/",fileupload.diskLoader.single("file"),async(req,res)=>{
    const id = req.query.id;
    console.log(id);
    
    //Upload to firebase storage
    const filename = Math.round(Math.random() * 1000)+".png";
    // Define locations to be saved on storag
    const storageRef = ref(storage,"/images/"+filename);
    // define file detail
    const metaData = {contentType : req.file!.mimetype};
    // Start upload
    const snapshost = await uploadBytesResumable(storageRef,req.file!.buffer, metaData);
    //Get url image from storage
    const url = await getDownloadURL(snapshost.ref);
    let sql ="INSERT INTO `Picture`(`url`,`UID`) VALUES (?,?)";
    sql = mysql.format(sql, [url, id]);

    conn.query(sql, async (err, result) => {
      if (err) throw err;

      res.status(201).json({
        affected_row: result.affectedRows,
        last_idx: result.insertId,
      });
      const currentDate =  getCurrentDate();
      //console.log(currentDate);
      
      let check2: any = await new Promise((resolve, reject) => {
        conn.query("INSERT INTO `Statics`(`PID`, `Date`, `point`) VALUES (?,?,?)",[result.insertId, currentDate,0], (err, result) => {
          if (err) reject(err);
          resolve(result);
        });
      });
      // let check3: any = await new Promise((resolve, reject) => {
      //   conn.query("INSERT INTO `Statics`(`PID`, `Date`, `point`) VALUES (?, DATE_SUB(CURDATE(), INTERVAL 1 DAY),?)",[result.insertId,0], (err, result) => {
      //     if (err) reject(err);
      //     resolve(result);
      //   });
      // });
    });
  
});



router.put("/",fileupload.diskLoader.single("file"),async(req,res)=>{
    const id = req.query.id;
    const pid = req.query.PID;
  
    
try {
   //Upload to firebase storage
   const filename = Math.round(Math.random() * 1000)+".png";
   // Define locations to be saved on storag
   const storageRef = ref(storage,"/images/"+filename);
   // define file detail
   const metaData = {contentType : req.file!.mimetype};
   // Start upload
   const snapshost = await uploadBytesResumable(storageRef,req.file!.buffer, metaData);
   //Get url image from storage
   const url = await getDownloadURL(snapshost.ref);
   let sql ="DELETE FROM Picture WHERE PID = ?";
   sql = mysql.format(sql, [pid]);

   conn.query(sql, async (err, result) => {
     if (err) throw err;

     const currentDate =  getCurrentDate();
     let check1: any = await new Promise((resolve, reject) => {
       conn.query("INSERT INTO `Picture`(`PID`, `url`, `UID`) VALUES (?,?,?)",[pid, url,id], (err, result) => {
         if (err) reject(err);
         resolve(result);
       });
     });
  
     let check2: any = await new Promise((resolve, reject) => {
       conn.query("INSERT INTO `Statics`(`PID`, `Date`, `point`) VALUES (?,?,?)",[pid, currentDate,0], (err, result) => {
         if (err) reject(err);
         resolve(result);
       });
     });

   });
 



} catch (error) {
  
}
   
  
});
function getCurrentDate(): string {
  const date = new Date();
  const timeZoneOffset = date.getTimezoneOffset() / 60;
  date.setHours(date.getHours() + timeZoneOffset + 7); // UTC+7 for Bangkok
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}


// router.post("/image",fileupload.diskLoader.single("file"),async(req,res)=>{
//   //Upload to firebase storage
//   const filename = Math.round(Math.random() * 1000)+".png";
//   // Define locations to be saved on storag
//   const storageRef = ref(storage,"/images/"+filename);
//   // define file detail
//   const metaData = {contentType : req.file!.mimetype};
//   // Start upload
//   const snapshost = await uploadBytesResumable(storageRef,req.file!.buffer, metaData);
//   //Get url image from storage
//   const url = await getDownloadURL(snapshost.ref)
//   let sql ='UPDATE `User` SET `image` = ? WHERE UID = 1';
//   sql = mysql.format(sql, [
//       url
//   ]);



