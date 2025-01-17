(function indexJS() {
  $(document).ready(() => {
    function notifyUser(message, typeString) {
      new Noty({
        text: message,
        type: typeString,
        theme: 'metroui',
      }).show();
    }

    $('#deleteCreationTemplates').hide();
    $('#deleteEncodingTemplate').hide();
    $('#deleteEncodingDiaries').hide();
    $('#encodeDiaries').attr('disabled', true);
    $('#loadEncodingTemplate').attr('disabled', true);

    const diaryTemplates = [];
    const scannedDiaries = [];
    let encodeTemplate = '';

    const dropzoneCreationTemplate = new Dropzone('#dropZone1', {
      url: '/upload_files', // Set the url
      acceptedFiles: 'application/pdf',
      clickable: '.loadCreationTemplate-button',
    });

    const encodingCreationTemplate = new Dropzone('#dropZone2', {
      url: '/upload_files', // Set the url
      acceptedFiles: 'image/tiff, image/png',
      maxFiles: '1',
      clickable: '.loadEncodingTemplate-button',
    });

    const encodingCreationDiaries = new Dropzone('#dropZone3', {
      url: '/upload_files', // Set the url
      acceptedFiles: 'image/tiff, application/zip, application/x-zip-compressed',
      clickable: '.loadEncodingDiaries-button',
    });

    function configureCreateTemplateUploader() {
      // Update the total progress bar
      dropzoneCreationTemplate.on('totaluploadprogress', (progress) => {
        document.querySelector('#progress-bar').style.width = `${progress}%`;
      });

      dropzoneCreationTemplate.on('sending', (file, xhr, data) => {
        // Append the folder to save the file to
        data.append('folder', 'creation');
        // Show the total progress bar when upload starts
        document.querySelector('#progress-bar-container').style.opacity = '1';
      });

      dropzoneCreationTemplate.on('success', (file) => {
        // Append uploaded files to list
        $('#diariesTemplates').append(`<option disabled="true" class="combo_list_item">${file.name}</option>`);
      });
      // Hide the total progress bar when nothing's uploading anymore
      dropzoneCreationTemplate.on('queuecomplete', (progress) => {
        document.querySelector('#progress-bar-container').style.opacity = '0';
        document.querySelector('#progress-bar').style.width = '0%';
        $('#deleteCreationTemplates').attr('disabled', false);
        $('#deleteCreationTemplates').show();
        $('#createDiaries').attr('disabled', false);
      });
    }

    function configureEncodingTemplateUploader() {

      encodingCreationTemplate.on('sending', (file, xhr, data) => {
        // Append the folder to save the file to
        data.append('folder', 'encodingTemplate');
      });

      encodingCreationTemplate.on('success', (file) => {
        // Process encoding template
        checkEncodingTemplateInServer();
      });
      // Hide the total progress bar when nothing's uploading anymore
      encodingCreationTemplate.on('queuecomplete', (progress) => {
        $('#deleteEncodingTemplate').attr('disabled', false);
        $('#deleteEncodingTemplate').show();

        if (Object.keys(scannedDiaries).length > 0) {
          $('#encodeDiaries').attr('disabled', false);
        }
      });
    }

    function configureEncodingDiariesUploader() {
      // Update the total progress bar
      encodingCreationDiaries.on('totaluploadprogress', (progress) => {
        document.querySelector('#progress-bar-encoding').style.width = `${progress}%`;
      });

      encodingCreationDiaries.on('sending', (file, xhr, data) => {
        // Append the folder to save the file to
        data.append('folder', 'encodingDiaries');
        // Show the total progress bar when upload starts
        document.querySelector('#progress-bar-encoding-container').style.opacity = '1';
      });

      encodingCreationDiaries.on('error', (file, error) => {
        // Upload failed
        notifyUser(`Error while uploading :${error}`, 'error');
      });

      encodingCreationDiaries.on('success', (file) => {
        // Upload was successful
        $('#encodingDiariesList').append(`<option disabled="true" class="combo_list_item">${file.name}</option>`);
        notifyUser('Upload successful', 'success');
      });
      // Hide the total progress bar when nothing's uploading anymore
      encodingCreationDiaries.on('queuecomplete', (progress) => {
        document.querySelector('#progress-bar-encoding-container').style.opacity = '0';
        document.querySelector('#progress-bar-encoding').style.width = '0%';
        $('#deleteEncodingDiaries').attr('disabled', false);
        $('#deleteEncodingDiaries').show();

        if (encodeTemplate !== '') {
          $('#encodeDiaries').attr('disabled', false);
        }
      });
    }


    // Get a list of all the templates that will become diaries
    function checkCreationTemplatesInServer() {
      $.get('/pdf_template_diaries').done((data) => {
        $('#diariesTemplates > option').remove();
        if (data.templates_file_names.length < 1) {
          $('#deleteCreationTemplates').attr('disabled', true);
          $('#createDiaries').attr('disabled', true);
          $('#deleteCreationTemplates').hide();
        } else {
          $('#deleteCreationTemplates').show();
          Object.entries(data.templates_file_names).forEach(([, value]) => $('#diariesTemplates').append(`<option disabled="true" class="combo_list_item">${value}</option>`));
          Object.entries(data.templates_paths).forEach(([, value]) => diaryTemplates.push(value));
        }
      });
    }

    // Get the encoding template
    function checkEncodingTemplateInServer() {
      $.get('/encoding_template').done((data) => {
        $('#encodingTemplateList > li').remove();
        if (data.template === '') {
          encodeTemplate = '';
          $('#deleteEncodingTemplate').attr('disabled', true);
          $('#deleteEncodingTemplate').hide();
          $('#encodeDiaries').attr('disabled', true);
          $('#loadEncodingTemplate').attr('disabled', false);
        } else {
          encodeTemplate = data.template;
          if (Object.keys(scannedDiaries).length > 0) {
            $('#encodeDiaries').attr('disabled', false);
          }
          $('#loadEncodingTemplate').attr('disabled', true);
          $('#deleteEncodingTemplate').show();
          $('#encodingTemplateList').append(`<li>${data.template}</li>`);
        }
      });
    }

    // Get a list of all the diaries to encode
    function checkEncodingDiariesInServer() {
      $.get('/scanned_diaries').done((data) => {
        $('#encodingDiariesList > option').remove();
        if (data.diaries.length < 1) {
          $('#deleteEncodingDiaries').attr('disabled', true);
          $('#encodeDiaries').attr('disabled', true);
          $('#deleteEncodingDiaries').hide();
        } else {
          $('#deleteEncodingDiaries').show();
          if (encodeTemplate !== '') {
            $('#encodeDiaries').attr('disabled', false);
          }
          Object.entries(data.diaries).forEach(([, value]) => $('#encodingDiariesList').append(`<option disabled="true" class="combo_list_item">${value}</option>`));
          Object.entries(data.diaries_paths).forEach(([, value]) => scannedDiaries.push(value));
        }
      });
    }

    configureCreateTemplateUploader();
    configureEncodingTemplateUploader();
    configureEncodingDiariesUploader();

    checkCreationTemplatesInServer();
    checkEncodingTemplateInServer();
    checkEncodingDiariesInServer();

    function deleteFilesInFolder(folderName, callbackDone) {
      $.post(
        '/delete_files',
        JSON.stringify({
          folder: folderName,
        }),
      ).done((data) => {
        notifyUser('All templates deleted', 'success');
        callbackDone();
      }).fail((xhr, status, error) => {
        console.log(`Error deleting files in ${folderName}`);
        console.log(status);
      });
    }

    $('#deleteCreationTemplates').click((event) => {
      deleteFilesInFolder('creation', checkCreationTemplatesInServer);
    });

    $('#deleteEncodingTemplate').click((event) => {
      deleteFilesInFolder('encodingTemplate', checkEncodingTemplateInServer);
    });

    $('#deleteEncodingDiaries').click((event) => {
      deleteFilesInFolder('encodingDiaries', checkEncodingDiariesInServer);
    });


    $('#createDiaries').click(() => {
      location.href = '/static/create.html';
    });

    $('#encodeDiaries').click(() => {
      location.href = '/static/encode.html';
    });
  });
}());
