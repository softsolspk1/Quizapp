import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const PdfViewerScreen = ({ navigation, route }) => {
  const { title, url } = route.params;

  // For Android, we use a custom injected PDF.js viewer
  const getPdfViewerHtml = (pdfUrl) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
        <style>
          body { margin: 0; padding: 0; background-color: #f9fafb; display: flex; flex-direction: column; align-items: center; }
          canvas { max-width: 100%; margin-bottom: 10px; box-shadow: 0px 2px 5px rgba(0,0,0,0.2); }
          #pdf-container { width: 100%; display: flex; flex-direction: column; align-items: center; padding: 10px 0; }
          .loading { font-family: sans-serif; padding: 20px; color: #6d28d9; }
        </style>
      </head>
      <body>
        <div id="loading" class="loading">Loading PDF...</div>
        <div id="pdf-container"></div>
        <script>
          var url = '${pdfUrl}';
          var pdfjsLib = window['pdfjs-dist/build/pdf'];
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

          var loadingTask = pdfjsLib.getDocument(url);
          loadingTask.promise.then(function(pdf) {
            document.getElementById('loading').style.display = 'none';
            for (var pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
              pdf.getPage(pageNum).then(function(page) {
                var scale = 1.5;
                var viewport = page.getViewport({scale: scale});
                var canvas = document.createElement('canvas');
                var ctx = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                canvas.setAttribute('data-page', page._pageIndex + 1);
                
                var container = document.getElementById('pdf-container');
                var inserted = false;
                for (var i = 0; i < container.children.length; i++) {
                  if (parseInt(container.children[i].getAttribute('data-page')) > (page._pageIndex + 1)) {
                    container.insertBefore(canvas, container.children[i]);
                    inserted = true;
                    break;
                  }
                }
                if (!inserted) {
                  container.appendChild(canvas);
                }

                var renderContext = {
                  canvasContext: ctx,
                  viewport: viewport
                };
                page.render(renderContext);
              });
            }
          }, function (reason) {
            document.getElementById('loading').innerText = 'Error loading PDF: ' + reason.message;
          });
        </script>
      </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <LinearGradient 
          colors={['#1e1b4b', '#4c1d95', '#6d28d9']} 
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          <View style={{ width: 32 }} />
        </LinearGradient>
        
        <WebView
          source={Platform.OS === 'ios' ? { uri: url } : { html: getPdfViewerHtml(url) }}
          originWhitelist={['*']}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#6d28d9" />
              <Text style={styles.loadingText}>Loading document...</Text>
            </View>
          )}
          style={{ flex: 1 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowFileAccess={true}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1e1b4b' },
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { 
    paddingTop: 10,
    paddingBottom: 15, 
    paddingHorizontal: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  backButton: { padding: 6 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center', fontFamily: 'Inter-Bold' },
  loader: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb', zIndex: 99 },
  loadingText: { marginTop: 10, color: '#4b5563', fontSize: 14, fontFamily: 'Inter-Medium' }
});

export default PdfViewerScreen;
