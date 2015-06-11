'use strict';

angular.module('spinnaker.pipelines.stage.pipeline')
  .config(function(pipelineConfigProvider) {
    pipelineConfigProvider.registerStage({
      label: 'Pipeline',
      description: 'Runs a pipeline',
      key: 'pipeline',
      controller: 'pipelineStageCtrl',
      controllerAs: 'pipelineStageCtrl',
      templateUrl: 'scripts/modules/pipelines/config/stages/pipeline/pipelineStage.html',
      executionDetailsUrl: 'scripts/modules/pipelines/config/stages/pipeline/pipelineExecutionDetails.html',
      executionLabelTemplateUrl: 'scripts/modules/pipelines/config/stages/pipeline/pipelineExecutionLabel.html',
      validators: [
        {
          type: 'requiredField',
          fieldName: 'pipeline',
          message: '<strong>Pipeline</strong> is a required field on pipeline stages.',
        },
      ],
    });
  }).controller('pipelineStageCtrl', function($scope, stage, pipelineConfigService, applicationReader) {

    $scope.stage = stage;

    $scope.stage.application = $scope.application.name;

    $scope.viewState = {
      mastersLoaded: false,
      mastersRefreshing: false,
      mastersLastRefreshed: null,
      pipelinesLoaded : false,
      jobsRefreshing: false,
      jobsLastRefreshed: null,
      infiniteScroll: {
        numToAdd: 20,
        currentItems: 20,
      },
    };

    this.addMoreItems = function() {
      $scope.viewState.infiniteScroll.currentItems += $scope.viewState.infiniteScroll.numToAdd;
    };

    applicationReader.listApplications().then(function(applications) {
      $scope.applications = _.pluck(applications, 'name').sort();
    });

    function initializeMasters() {
      if ($scope.stage.application) {
        pipelineConfigService.getPipelinesForApplication($scope.stage.application).then(function (pipelines) {
          $scope.pipelines = _.filter( pipelines, function(pipeline){ return pipeline.id !== $scope.pipeline.id; } );
          if (!_.find( pipelines, function(pipeline) { return pipeline.id === $scope.stage.pipeline; })) {
            $scope.stage.pipeline = null;
          }
          $scope.viewState.pipelinesLoaded = true;
          updatePipelineConfig();
        });
      } else {
        $scope.viewState.pipelinesLoaded = true;
        updatePipelineConfig();
      }
    }

    function updatePipelineConfig() {
      if ($scope.stage && $scope.stage.application && $scope.stage.pipeline) {
        var config = _.find( $scope.pipelines, function(pipeline){ return pipeline.id === $scope.stage.pipeline; } );
        if(config && config.parameterConfig) {
          if (!$scope.stage.pipelineParameters) {
            $scope.stage.pipelineParameters = {};
          }
          $scope.pipelineParameters = config.parameterConfig;
          $scope.userSuppliedParameters = $scope.stage.pipelineParameters;
          $scope.useDefaultParameters = {};
          _.each($scope.pipelineParameters, function (property) {
            if (!(property.name in $scope.stage.pipelineParameters) && (property.default !== null)) {
              $scope.useDefaultParameters[property.name] = true;
            }
          });
        } else {
          clearParams();
        }
      } else {
        clearParams();
      }
    }

    function clearParams() {
      $scope.pipelineParameters = {};
      $scope.useDefaultParameters = {};
      $scope.userSuppliedParameters = {};
    }

    $scope.useDefaultParameters = {};
    $scope.userSuppliedParameters = {};

    this.updateParam = function(parameter){
      if($scope.useDefaultParameters[parameter] === true){
        delete $scope.userSuppliedParameters[parameter];
        delete $scope.stage.parameters[parameter];
      } else if($scope.userSuppliedParameters[parameter]){
        $scope.stage.pipelineParameters[parameter] = $scope.userSuppliedParameters[parameter];
      }
    };

    $scope.$watch('stage.application', initializeMasters);
    $scope.$watch('stage.pipeline', updatePipelineConfig);

  });
