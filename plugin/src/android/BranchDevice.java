package io.branch;

import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Method;
import java.util.UUID;
import java.util.jar.JarFile;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.ActivityManager;
import android.app.ActivityManager.MemoryInfo;
import android.bluetooth.BluetoothAdapter;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.PackageManager.NameNotFoundException;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.provider.Settings.Secure;
import android.telephony.TelephonyManager;
import android.util.DisplayMetrics;
import android.util.Log;

public class BranchDevice extends CordovaPlugin {
	public static final String BLANK = "bnc_no_value";
	private static boolean isRealHardwareId;
    private static String linkClickIdentifier;
    
	private static final int STATE_FRESH_INSTALL = 0;
	private static final int STATE_UPDATE = 2;
	private static final int STATE_NO_CHANGE = 1;
    
    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        Intent intent = cordova.getActivity().getIntent();
        if (intent != null) {
            Uri data = intent.getData();
            if (data != null) {
                linkClickIdentifier = data.getQueryParameter("link_click_id");
            }
        }
    }
    
    @Override
    public boolean execute(String action, final JSONArray args, final CallbackContext callbackContext) throws JSONException {
    	Log.d("BranchDevice", "Action: " + action + " Args: " + args);
        if ("getInstallData".equals(action)) {
        	cordova.getThreadPool().execute(new Runnable() {
        		@Override
        		public void run() {
        			getInstallData(args, callbackContext);
        		}
        	});
        } else if ("getOpenData".equals(action)) {
        	cordova.getThreadPool().execute(new Runnable() {
        		@Override
        		public void run() {
        			getOpenData(args, callbackContext);
        		}
        	});
        } else {
            return false;
        }
        return true;
    }
    
    private void getInstallData(JSONArray args, CallbackContext callbackContext) {
		JSONObject installPost = new JSONObject();
		try {
			boolean debug = args.optBoolean(0);
			Log.d("BranchDevice", "GetInstallData debug value is " + debug);
			int isReferrable = args.optInt(1, -1);
			Log.d("BranchDevice", "GetInstallData isReferrable value is " + isReferrable);
			String idStr = getUniqueID(debug);
			if (!idStr.equals(BLANK)) {
				installPost.put("hardware_id", idStr);
				installPost.put("is_hardware_id_real", hasRealHardwareId());
			}
			if (!getAppVersion().equals(BLANK))
				installPost.put("app_version", getAppVersion());
			if (!getCarrier().equals(BLANK))
				installPost.put("carrier", getCarrier());
			installPost.put("bluetooth", getBluetoothPresent());
			if (!getBluetoothVersion().equals(BLANK))
				installPost.put("bluetooth_version", getBluetoothVersion());
			installPost.put("has_nfc", getNFCPresent());
			installPost.put("has_telephone", getTelephonePresent());
			if (!getPhoneBrand().equals(BLANK))
				installPost.put("brand", getPhoneBrand());
			if (!getPhoneModel().equals(BLANK))
				installPost.put("model", getPhoneModel());
			if (!getOS().equals(BLANK))
				installPost.put("os", getOS());
			String uriScheme = getURIScheme();
			if (!uriScheme.equals(BLANK)) 
				installPost.put("uri_scheme", uriScheme);
			installPost.put("os_version", getOSVersion());
			
			DisplayMetrics dMetrics = new DisplayMetrics();
			cordova.getActivity().getWindowManager().getDefaultDisplay().getMetrics(dMetrics);
			installPost.put("screen_dpi", dMetrics.densityDpi);
			installPost.put("screen_height", dMetrics.heightPixels);
			installPost.put("screen_width", dMetrics.widthPixels);
			installPost.put("wifi", getWifiConnected());
			if (isReferrable < 0) {
				installPost.put("is_referrable", (getUpdateState(false) == 0)?1:0);
			} else {
				installPost.put("is_referrable",  isReferrable);
			}
			installPost.put("update", getUpdateState(true));
			if (linkClickIdentifier != null) {
				installPost.put("link_identifier", linkClickIdentifier);
			}
			Log.d("BranchDevice", "data: " + installPost.toString());
			callbackContext.success(installPost);
		} catch (JSONException ex) {
			Log.e("BranchDevice", "Exception creatin install data: " + ex.getMessage());
			callbackContext.error(ex.getMessage());
		}
    }
	
    private void getOpenData(JSONArray args, CallbackContext callbackContext) {
		JSONObject openPost = new JSONObject();
		try {
			int isReferrable = args.optInt(0, -1);
			Log.d("BranchDevice", "GetInstallData isReferrable value is " + isReferrable);
			if (isReferrable < 0) {
				openPost.put("is_referrable", 0);
			} else {
				openPost.put("is_referrable", isReferrable);
			}
			if (!getAppVersion().equals(BLANK))
				openPost.put("app_version", getAppVersion());
			openPost.put("os_version", getOSVersion());
			String uriScheme = getURIScheme();
			if (!uriScheme.equals(BLANK)) 
				openPost.put("uri_scheme", uriScheme);
			if (!getOS().equals(BLANK))
				openPost.put("os", getOS());
			if (linkClickIdentifier != null) {
				openPost.put("link_identifier", linkClickIdentifier);
			}
			callbackContext.success(openPost);
		} catch (JSONException ex) {
			Log.e("BranchDevice", "Exception creatin open data: " + ex.getMessage());
			callbackContext.error(ex.getMessage());
		}
    }
    
	public String getUniqueID(boolean debug) {
		if (cordova.getActivity() != null) { 
			String androidID = null;
			if (!debug) {
				androidID = Secure.getString(cordova.getActivity().getContentResolver(), Secure.ANDROID_ID);
			}
			if (androidID == null) {
				androidID = UUID.randomUUID().toString();
				isRealHardwareId = false;
			}
			return androidID;
		} else 
			return BLANK;
	}
	
	public boolean hasRealHardwareId() {
		return isRealHardwareId;
	}
	
	public String getURIScheme() {
	    return getURIScheme(cordova.getActivity().getPackageName());
	}
	
	public String getURIScheme(String packageName) {
		String scheme = BLANK;
		if (!isLowOnMemory()) {
			PackageManager pm = cordova.getActivity().getPackageManager();
			try {
		        ApplicationInfo ai = pm.getApplicationInfo(packageName, 0);
		        String sourceApk = ai.publicSourceDir;
		        JarFile jf = null;
		        InputStream is = null;
		        byte[] xml = null;
		        try {
		            jf = new JarFile(sourceApk);
	            	is = jf.getInputStream(jf.getEntry("AndroidManifest.xml"));
		            xml = new byte[is.available()];
	                is.read(xml);
		            scheme = new ApkParser().decompressXML(xml);
		        } catch (Exception ignored) {
                } catch (OutOfMemoryError ignored) {
		        } finally {
		        	xml = null;
		        	try {
		        		if (is != null) {
		        			is.close();
		        			is = null;
		        		}
		        		if (jf != null) {
		        			jf.close();	
		        			jf = null;
		        		}
		        	} catch (IOException ignored) {}
		        }
		    } catch (NameNotFoundException ignored) {
		    }
		}
		return scheme;
	}
	
	private boolean isLowOnMemory() {
		ActivityManager activityManager = (ActivityManager) cordova.getActivity().getSystemService(Context.ACTIVITY_SERVICE);
		MemoryInfo mi = new MemoryInfo();
		activityManager.getMemoryInfo(mi);
		return mi.lowMemory;
	}
	
	public String getAppVersion() {
		 try {
			 PackageInfo packageInfo = cordova.getActivity().getPackageManager().getPackageInfo(cordova.getActivity().getPackageName(), 0);
			 if (packageInfo.versionName != null)
				 return packageInfo.versionName;
			 else
				 return BLANK;
		 } catch (NameNotFoundException ignored ) {
		 }
		 return BLANK;
	}
	
	public String getCarrier() {
        TelephonyManager telephonyManager = (TelephonyManager) cordova.getActivity().getSystemService(Context.TELEPHONY_SERVICE);
        if (telephonyManager != null) {
        	String ret = telephonyManager.getNetworkOperatorName();
            if (ret != null)
            	return ret;
        }
        return BLANK;
	}
	
	public boolean getBluetoothPresent() {
        try {
            BluetoothAdapter bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
            if (bluetoothAdapter != null) {
                return bluetoothAdapter.isEnabled();
            }
        } catch (SecurityException ignored ) {
        }
        return false;
	}
	
	public String getBluetoothVersion() {
        if (android.os.Build.VERSION.SDK_INT >= 8) {
            if(android.os.Build.VERSION.SDK_INT >= 18 &&
                    cordova.getActivity().getPackageManager().hasSystemFeature(PackageManager.FEATURE_BLUETOOTH_LE)) {
                return "ble";
            } else if(cordova.getActivity().getPackageManager().hasSystemFeature(PackageManager.FEATURE_BLUETOOTH)) {
                return "classic";
            }
        }
        return BLANK;
	}
	
	public boolean getNFCPresent() {
		try {
			return cordova.getActivity().getPackageManager().hasSystemFeature("android.hardware.nfc");
		} catch (Exception ignored ) {
		}
		return false;
	}
	
	public boolean getTelephonePresent() {
		try {
			return cordova.getActivity().getPackageManager().hasSystemFeature("android.hardware.telephony");
		} catch (Exception ignored ) {
		}
		return false;
	}
	
	public String getPhoneBrand() {
		return android.os.Build.MANUFACTURER;
	}
	
	public String getPhoneModel() {
		return android.os.Build.MODEL;
	}
	
	public String getOS() {
		return "Android";
	}
	
	public String getOSVersion() {
		return String.valueOf(android.os.Build.VERSION.SDK_INT);
	}
	
	public boolean isSimulator() {
		return android.os.Build.FINGERPRINT.contains("generic");
	}
	
	@SuppressLint("NewApi")
	public int getUpdateState(boolean updatePrefs) {
		Context context = cordova.getActivity().getApplicationContext();
		SharedPreferences prefs = context.getSharedPreferences("cordova_prefs", Context.MODE_PRIVATE);
		String currAppVersion = getAppVersion(); 
		String storedAppVersion = prefs.getString("bnc_app_version", "");
		if (storedAppVersion.isEmpty()) {
			// if no app version is in storage, this must be the first time Branch is here
			if (updatePrefs) {
				Editor editor = prefs.edit();
				editor.putString("bnc_app_version", currAppVersion);
				editor.commit();
			}
			if (android.os.Build.VERSION.SDK_INT >= 9) {
				// if we can access update/install time, use that to check if it's a fresh install or update
				try {
					PackageInfo packageInfo = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
					if (packageInfo.lastUpdateTime != packageInfo.firstInstallTime) {
						return STATE_UPDATE;
					}
					return STATE_FRESH_INSTALL;
				} catch (NameNotFoundException ignored ) { }
			}
			// otherwise, just register an install
			return STATE_FRESH_INSTALL;
		} else if (!storedAppVersion.equals(currAppVersion)) {
			// if the current app version doesn't match the stored, it's an update
			if (updatePrefs) {
				Editor editor = prefs.edit();
				editor.putString("bnc_app_version", currAppVersion);
				editor.commit();
			}
			return STATE_UPDATE;
		}
		// otherwise it's an open
		return STATE_NO_CHANGE;
	}
	
	public boolean getWifiConnected() {
		if (PackageManager.PERMISSION_GRANTED == cordova.getActivity().checkCallingOrSelfPermission(Manifest.permission.ACCESS_NETWORK_STATE)) {
            ConnectivityManager connManager = (ConnectivityManager) cordova.getActivity().getSystemService(Context.CONNECTIVITY_SERVICE);
            NetworkInfo wifiInfo = connManager.getNetworkInfo(ConnectivityManager.TYPE_WIFI);
            return wifiInfo.isConnected();
        }
		return false;
	}
	
	public String getAdvertisingId() {
		String advertisingId = null;
		
		try {
		    Class<?> AdvertisingIdClientClass = Class.forName("com.google.android.gms.ads.identifier.AdvertisingIdClient");
		    Method getAdvertisingIdInfoMethod = AdvertisingIdClientClass.getMethod("getAdvertisingIdInfo", Context.class);
		    Object adInfoObj = getAdvertisingIdInfoMethod.invoke(null, cordova.getActivity());
		    Method getIdMethod = adInfoObj.getClass().getMethod("getId");
		    advertisingId = (String) getIdMethod.invoke(adInfoObj);
		} catch(IllegalStateException ex) {
			ex.printStackTrace();
		} catch(Exception ignore) {
		}
		
		return advertisingId;
	}
	public class ApkParser {
		// decompressXML -- Parse the 'compressed' binary form of Android XML docs 
		// such as for AndroidManifest.xml in .apk files
		public static final int endDocTag = 0x00100101;
		public static final int startTag =  0x00100102;
		public static final int endTag =    0x00100103;
		
		public String decompressXML(byte[] xml) {
			// Compressed XML file/bytes starts with 24x bytes of data,
			// 9 32 bit words in little endian order (LSB first):
			//   0th word is 03 00 08 00
			//   3rd word SEEMS TO BE:  Offset at then of StringTable
			//   4th word is: Number of strings in string table
			// WARNING: Sometime I indiscriminently display or refer to word in 
			//   little endian storage format, or in integer format (ie MSB first).
			int numbStrings = LEW(xml, 4*4);
		
			// StringIndexTable starts at offset 24x, an array of 32 bit LE offsets
			// of the length/string data in the StringTable.
			int sitOff = 0x24;  // Offset of start of StringIndexTable
		
			// StringTable, each string is represented with a 16 bit little endian 
			// character count, followed by that number of 16 bit (LE) (Unicode) chars.
			int stOff = sitOff + numbStrings*4;  // StringTable follows StrIndexTable
		
			// XMLTags, The XML tag tree starts after some unknown content after the
			// StringTable.  There is some unknown data after the StringTable, scan
			// forward from this point to the flag for the start of an XML start tag.
			int xmlTagOff = LEW(xml, 3*4);  // Start from the offset in the 3rd word.
			// Scan forward until we find the bytes: 0x02011000(x00100102 in normal int)
			for (int ii=xmlTagOff; ii<xml.length-4; ii+=4) {
				if (LEW(xml, ii) == startTag) { 
					xmlTagOff = ii;  break;
				}
			} // end of hack, scanning for start of first start tag
		
			// XML tags and attributes:
			// Every XML start and end tag consists of 6 32 bit words:
			//   0th word: 02011000 for startTag and 03011000 for endTag 
			//   1st word: a flag?, like 38000000
			//   2nd word: Line of where this tag appeared in the original source file
			//   3rd word: FFFFFFFF ??
			//   4th word: StringIndex of NameSpace name, or FFFFFFFF for default NS
			//   5th word: StringIndex of Element Name
			//   (Note: 01011000 in 0th word means end of XML document, endDocTag)
		
			// Start tags (not end tags) contain 3 more words:
			//   6th word: 14001400 meaning?? 
			//   7th word: Number of Attributes that follow this tag(follow word 8th)
			//   8th word: 00000000 meaning??
		
			// Attributes consist of 5 words: 
			//   0th word: StringIndex of Attribute Name's Namespace, or FFFFFFFF
			//   1st word: StringIndex of Attribute Name
			//   2nd word: StringIndex of Attribute Value, or FFFFFFF if ResourceId used
			//   3rd word: Flags?
			//   4th word: str ind of attr value again, or ResourceId of value
		
			// Step through the XML tree element tags and attributes
			int off = xmlTagOff;
			int indent = 0;
			int startTagLineNo = -2;
			while (off < xml.length) {
				int tag0 = LEW(xml, off);
				int lineNo = LEW(xml, off+2*4);
				int nameSi = LEW(xml, off+5*4);
			
				if (tag0 == startTag) { // XML START TAG
					int numbAttrs = LEW(xml, off+7*4);  // Number of Attributes to follow
					off += 9*4;  // Skip over 6+3 words of startTag data
					startTagLineNo = lineNo;
			
					// Look for the Attributes
					for (int ii=0; ii<numbAttrs; ii++) {
						int attrNameSi = LEW(xml, off+1*4);  // AttrName String Index
						int attrValueSi = LEW(xml, off+2*4); // AttrValue Str Ind, or FFFFFFFF
						int attrResId = LEW(xml, off+4*4);  // AttrValue ResourceId or dup AttrValue StrInd
						off += 5*4;  // Skip over the 5 words of an attribute
			
						String attrName = compXmlString(xml, sitOff, stOff, attrNameSi);
						String attrValue = attrValueSi!=-1 ? compXmlString(xml, sitOff, stOff, attrValueSi) : "resourceID 0x"+Integer.toHexString(attrResId);
						if (attrName.equals("scheme")) {
							return attrValue;
						}
					}
					indent++;
			
				} else if (tag0 == endTag) { // XML END TAG
					indent--;
					off += 6*4;  // Skip over 6 words of endTag data
					String name = compXmlString(xml, sitOff, stOff, nameSi);
					prtIndent(indent, "</"+name+">  (line "+startTagLineNo+"-"+lineNo+")");		
				} else if (tag0 == endDocTag) {  // END OF XML DOC TAG
					break;
				} else {
					break;
				}
			} // end of while loop scanning tags and attributes of XML tree
			Log.d("BranchAPKParser", "    end at offset "+off);
			
			return BLANK;
		} // end of decompressXML


		public String compXmlString(byte[] xml, int sitOff, int stOff, int strInd) {
			if (strInd < 0) return null;
			int strOff = stOff + LEW(xml, sitOff+strInd*4);
			return compXmlStringAt(xml, strOff);
		}


		public static final String spaces = "                                             ";
		public void prtIndent(int indent, String str) {
			Log.d("BranchAPKParser", (spaces.substring(0, Math.min(indent*2, spaces.length()))+str));
		}


		// compXmlStringAt -- Return the string stored in StringTable format at
		// offset strOff.  This offset points to the 16 bit string length, which 
		// is followed by that number of 16 bit (Unicode) chars.
		public String compXmlStringAt(byte[] arr, int strOff) {
			int strLen = arr[strOff+1]<<8&0xff00 | arr[strOff]&0xff;
			byte[] chars = new byte[strLen];
			for (int ii=0; ii<strLen; ii++) {
				chars[ii] = arr[strOff+2+ii*2];
			}
			return new String(chars);  // Hack, just use 8 byte chars
		} // end of compXmlStringAt


		// LEW -- Return value of a Little Endian 32 bit word from the byte array
		//   at offset off.
		public int LEW(byte[] arr, int off) {
			return arr[off+3]<<24&0xff000000 | arr[off+2]<<16&0xff0000 | arr[off+1]<<8&0xff00 | arr[off]&0xFF;
		} // end of LEW
	}
}
